import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { chatModel, describeAiError, hasAiKey } from "@/lib/ai/model";
import { toolsForSession } from "@/lib/ai/registry";
import { buildInstructions } from "@/lib/ai/system-prompt";
import { cleanAssistantText, needsRanking } from "@/lib/ai/text";
import { getSessionState } from "@/lib/auth/session";

export const maxDuration = 60;

const OFFLINE_CODE = "ASISTEN_OFFLINE";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PER_MINUTE = 20;
const requests = new Map<string, number[]>();

function overLimit(userId: string) {
  const now = Date.now();
  const recent = (requests.get(userId) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= MAX_PER_MINUTE) {
    requests.set(userId, recent);
    return true;
  }
  requests.set(userId, [...recent, now]);
  return false;
}

const textOf = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

/**
 * History comes from the browser, so only user and assistant text is forwarded.
 * Tool results are dropped so a forged result can never reach the model as database data.
 */
function safeHistory(messages: UIMessage[]) {
  return messages
    .slice(-30)
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      ...message,
      parts: message.parts.flatMap((part) =>
        part.type !== "text"
          ? []
          : [{ ...part, text: message.role === "assistant" ? cleanAssistantText(part.text) : part.text }],
      ),
    }))
    .filter((message) => textOf(message).trim().length > 0);
}

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status === "anonymous") return Response.json({ error: "unauthorized" }, { status: 401 });
  if (state.status !== "ready") return Response.json({ error: "no_profile" }, { status: 403 });
  const { session } = state;

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || !body.messages.every((m) => Array.isArray(m?.parts))) throw new Error();
    messages = body.messages;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const last = messages.at(-1);
  if (!last || last.role !== "user" || !textOf(last).trim() || textOf(last).length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "bad_message" }, { status: 400 });
  }
  if (overLimit(session.userId)) return new Response(OFFLINE_CODE, { status: 429 });
  if (!hasAiKey()) {
    console.error("[chat] no AI provider key is set");
    return new Response(OFFLINE_CODE, { status: 503 });
  }

  const history = safeHistory(messages);
  const tools = toolsForSession(session);
  const forceRanking =
    "rekomendasikan_vendor" in tools && needsRanking(textOf(last), history.map(textOf).join("\n"));

  const result = streamText({
    model: chatModel(),
    instructions: buildInstructions(session),
    messages: await convertToModelMessages(history),
    tools,
    // Rankings must come from the database, so the first step cannot answer from memory.
    prepareStep: ({ stepNumber }) =>
      forceRanking && stepNumber === 0
        ? { toolChoice: { type: "tool" as const, toolName: "rekomendasikan_vendor" } }
        : {},
    // A document task can need project, ranking, Excel, summary, and PowerPoint in one turn.
    stopWhen: isStepCount(10),
    temperature: 0.2,
    maxRetries: 0, // the model chain already moves to the next model
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onError: (error) => {
        console.error("[chat] AI error:", describeAiError(error));
        return OFFLINE_CODE;
      },
    }),
  });
}
