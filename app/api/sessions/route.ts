import { getSessionState } from "@/lib/auth/session";
import { userDb } from "@/lib/db/server";

export async function GET() {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ error: "unauthorized" }, { status: 401 });

  const supabase = await userDb();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, judul, updated_at")
    .eq("profile_id", state.session.userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return Response.json({ error: "failed" }, { status: 500 });
  return Response.json(data ?? []);
}
