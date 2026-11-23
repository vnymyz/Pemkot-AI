import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseEnv } from "@/lib/db/env";

const PUBLIC_PATHS = new Set(["/", "/login"]);

/** Refreshes the login session on each request and guards every non-public path. */
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  let response = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};
  let userId: string | null = null;

  const env = publicSupabaseEnv();
  if (env) {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items, headers) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          cacheHeaders = headers ?? {};
          Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  // A redirect must carry refreshed cookies, or the user is logged out by accident.
  const withSession = (target: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) => target.headers.set(key, value));
    return target;
  };

  if (!userId && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return withSession(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return withSession(NextResponse.redirect(url));
  }

  if (userId && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withSession(NextResponse.redirect(url));
  }

  return response;
}
