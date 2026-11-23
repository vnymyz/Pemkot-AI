import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseEnv } from "./env";

/** Supabase client acting as the logged-in user, so RLS applies. */
export async function userDb() {
  const env = publicSupabaseEnv();
  if (!env) throw new Error("Missing public Supabase settings in .env.local");

  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. The middleware refreshes the session instead.
        }
      },
    },
  });
}
