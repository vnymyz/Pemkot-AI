import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { userDb } from "@/lib/db/server";

type Params = { params: Promise<{ id: string }> };

const MAX_BODY_BYTES = 2_000_000;
const idSchema = z.uuid();
const bodySchema = z.object({
  judul: z.string().max(80).nullable(),
  messages: z.array(z.unknown()).max(200),
});

async function context({ params }: Params) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return null;
  return { id, userId: state.session.userId, supabase: await userDb() };
}

const denied = () => Response.json({ error: "unauthorized" }, { status: 401 });

export async function GET(_request: Request, params: Params) {
  const ctx = await context(params);
  if (!ctx) return denied();
  const { data, error } = await ctx.supabase
    .from("chat_sessions")
    .select("messages")
    .eq("id", ctx.id)
    .eq("profile_id", ctx.userId)
    .maybeSingle();
  if (error) return Response.json({ error: "failed" }, { status: 500 });
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ messages: data.messages });
}

export async function PUT(request: Request, params: Params) {
  const ctx = await context(params);
  if (!ctx) return denied();

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const { error } = await ctx.supabase.from("chat_sessions").upsert({
    id: ctx.id,
    profile_id: ctx.userId,
    judul: parsed.data.judul,
    messages: parsed.data.messages,
    updated_at: new Date().toISOString(),
  });
  if (error) return Response.json({ error: "failed" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, params: Params) {
  const ctx = await context(params);
  if (!ctx) return denied();
  const { error } = await ctx.supabase.from("chat_sessions").delete().eq("id", ctx.id).eq("profile_id", ctx.userId);
  if (error) return Response.json({ error: "failed" }, { status: 500 });
  return Response.json({ ok: true });
}
