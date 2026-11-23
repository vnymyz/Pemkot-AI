import "server-only";
import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { APICallError } from "ai";

/**
 * Model chain: every Gemini model first, then Groq as a backup.
 * We move to the next model only on quota (429), missing model (404), or server errors (5xx).
 * Bad requests (400) and bad keys stop immediately and never reach another provider.
 */
const DEFAULT_GEMINI = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
];

// Production models with tool use, checked against console.groq.com/docs on 2026-11-23.
// They do not support parallel tool calls, so tools must work when called one at a time.
const DEFAULT_GROQ = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

const COOLDOWN_MS = 10 * 60 * 1000;

type ProviderName = "gemini" | "groq";
export type ModelCandidate = { provider: ProviderName; model: LanguageModelV4 };

// "provider:modelId" -> time until which the model is skipped (in memory, per server process)
const cooldownUntil = new Map<string, number>();

function modelList(value: string | undefined, fallback: string[]) {
  const list = (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : fallback;
}

function geminiCandidates(): ModelCandidate[] {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return [];
  const google = createGoogle({ apiKey });
  return modelList(process.env.GEMINI_MODELS, DEFAULT_GEMINI).map((id) => ({
    provider: "gemini",
    model: google(id) as unknown as LanguageModelV4,
  }));
}

function groqCandidates(): ModelCandidate[] {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];
  const groq = createGroq({ apiKey });
  return modelList(process.env.GROQ_MODELS, DEFAULT_GROQ).map((id) => ({
    provider: "groq",
    model: groq(id) as unknown as LanguageModelV4,
  }));
}

export function hasAiKey() {
  return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GROQ_API_KEY);
}

function statusOf(error: unknown): number | undefined {
  return APICallError.isInstance(error) ? error.statusCode : undefined;
}

function isQuotaError(error: unknown) {
  const status = statusOf(error);
  if (status !== undefined) return status === 429;
  return /quota|RESOURCE_EXHAUSTED|\b429\b/i.test(String((error as Error)?.message ?? error));
}

function isUnavailable(error: unknown) {
  const status = statusOf(error);
  return status === 404 || (status !== undefined && status >= 500);
}

const keyOf = ({ provider, model }: ModelCandidate) => `${provider}:${model.modelId}`;

/** A model that sends no response in time counts as unavailable. Measured: some Gemini models stall for 35 to 40 seconds. */
export class ModelTimeoutError extends Error {
  constructor() {
    super("model_timeout");
    this.name = "ModelTimeoutError";
  }
}

const FIRST_RESPONSE_TIMEOUT_MS = Number(process.env.AI_FIRST_RESPONSE_TIMEOUT_MS) || 12_000;

type CallOptions = Parameters<LanguageModelV4["doGenerate"]>[0];

/** A LanguageModel that tries each candidate in order until one accepts the request. */
export function fallbackModel(
  candidates: ModelCandidate[],
  firstResponseTimeoutMs: number = FIRST_RESPONSE_TIMEOUT_MS,
): LanguageModelV4 {
  if (candidates.length === 0) throw new Error("no_ai_provider_configured");

  async function attempt<T>(
    options: CallOptions,
    run: (model: LanguageModelV4, options: CallOptions) => PromiseLike<T>,
  ): Promise<T> {
    const now = Date.now();
    const ready = candidates.filter((c) => (cooldownUntil.get(keyOf(c)) ?? 0) <= now);
    const order = ready.length ? ready : candidates; // all cooling down: try anyway

    let lastError: unknown;
    for (const candidate of order) {
      const controller = new AbortController();
      const abortSignal = options.abortSignal ? AbortSignal.any([options.abortSignal, controller.signal]) : controller.signal;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ModelTimeoutError());
        }, firstResponseTimeoutMs);
      });

      try {
        const result = await Promise.race([run(candidate.model, { ...options, abortSignal }), timeout]);
        console.info(`[ai] served by ${keyOf(candidate)}`);
        return result;
      } catch (error) {
        const timedOut = error instanceof ModelTimeoutError;
        const quota = isQuotaError(error);
        if (!timedOut && !quota && !isUnavailable(error)) throw error;
        lastError = error;
        cooldownUntil.set(keyOf(candidate), Date.now() + COOLDOWN_MS);
        console.warn(
          `[ai] ${keyOf(candidate)} unavailable (${timedOut ? "timeout" : quota ? "quota" : "error"}), trying next model`,
        );
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  return {
    specificationVersion: "v4",
    provider: "pemkot-fallback",
    modelId: `fallback(${candidates.map(keyOf).join(",")})`,
    // Empty on purpose: the SDK then downloads URLs itself, so any provider in the chain can read them.
    supportedUrls: {},
    doGenerate: (options) => attempt(options, (model, opts) => model.doGenerate(opts)),
    doStream: (options) => attempt(options, (model, opts) => model.doStream(opts)),
  };
}

export const chatModel = () => fallbackModel([...geminiCandidates(), ...groqCandidates()]);

/**
 * Gemini only: Groq's documentation does not confirm image input for its production models.
 * When this throws or fails, the caller must mark the document "perlu diperiksa manual".
 */
export const visionModel = () => fallbackModel(geminiCandidates(), 20_000);

/** Short machine-readable reason for logs. Users always see the calm offline message. */
export function describeAiError(error: unknown): string {
  const status = statusOf(error);
  if ((error as Error)?.message === "no_ai_provider_configured") return "no_ai_provider_configured";
  if (error instanceof ModelTimeoutError) return "model_timeout";
  if (isQuotaError(error)) return "quota_or_rate_limit";
  if (status === 404) return "model_not_found";
  if (status !== undefined && status >= 500) return "provider_down";
  if (status === 401 || status === 403 || /api key/i.test((error as Error)?.message ?? "")) return "bad_api_key";
  if (status === 400) return "bad_request";
  return (error as Error)?.name ?? "unknown";
}
