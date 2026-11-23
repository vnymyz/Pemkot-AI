import { getSessionState } from "@/lib/auth/session";
import { daftarNotifikasiPersetujuan } from "@/lib/services/notifications";

export async function GET() {
  const state = await getSessionState();
  if (state.status === "anonymous") return Response.json({ error: "unauthorized" }, { status: 401 });
  if (state.status !== "ready") return Response.json({ error: "no_profile" }, { status: 403 });

  try {
    return Response.json({ notifications: await daftarNotifikasiPersetujuan(state.session) });
  } catch (error) {
    console.error("[api/notifications] failed:", (error as Error).message);
    return Response.json({ error: "notifications_failed" }, { status: 500 });
  }
}
