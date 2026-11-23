import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { publicSupabaseEnv } from "@/lib/db/env";
import { userDb } from "@/lib/db/server";
import { isRole, type Role } from "./roles";

export type AuthSession = {
  userId: string;
  email: string;
  nama: string;
  role: Role;
  opdId: number | null;
  opdNama: string | null;
  vendorId: string | null;
  vendorNama: string | null;
};

export type SessionState =
  | { status: "anonymous" }
  | { status: "no_profile"; email: string }
  | { status: "ready"; session: AuthSession };

type ProfileRow = {
  nama: string;
  role: string;
  opd_id: number | null;
  vendor_id: string | null;
  opd: { nama: string } | null;
  vendor: { nama: string } | null;
};

/** Reads the verified user and their role from the profiles table, once per request. */
export const getSessionState = cache(async (): Promise<SessionState> => {
  if (!publicSupabaseEnv()) return { status: "anonymous" };

  const supabase = await userDb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const email = user.email ?? "";
  const { data, error } = await supabase
    .from("profiles")
    .select("nama, role, opd_id, vendor_id, opd:opd_id(nama), vendor:vendor_id(nama)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.error(`[auth] profile lookup failed: ${error.code ?? "unknown"}`);

  const profile = data as unknown as ProfileRow | null;
  if (!profile || !isRole(profile.role)) return { status: "no_profile", email };

  return {
    status: "ready",
    session: {
      userId: user.id,
      email,
      nama: profile.nama,
      role: profile.role,
      opdId: profile.opd_id,
      opdNama: profile.opd?.nama ?? null,
      vendorId: profile.vendor_id,
      vendorNama: profile.vendor?.nama ?? null,
    },
  };
});

/** For pages behind login. A logged-in account without a profile gets a notice from the layout. */
export async function requireSessionState() {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/login");
  return state;
}
