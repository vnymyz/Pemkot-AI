import { getSessionState } from "@/lib/auth/session";
import { globalSearch } from "@/lib/services/global-search";

export async function GET(request: Request) {
  const state = await getSessionState();
  if (state.status === "anonymous") return Response.json({ error: "unauthorized" }, { status: 401 });
  if (state.status !== "ready") return Response.json({ error: "no_profile" }, { status: 403 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return Response.json({ error: "invalid_query" }, { status: 400 });
  }

  try {
    return Response.json({ results: await globalSearch(state.session, query) });
  } catch (error) {
    console.error("[api/search] failed:", (error as Error).message);
    return Response.json({ error: "search_failed" }, { status: 500 });
  }
}
