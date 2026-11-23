import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import type { PenugasanRingkas, ProyekDetail, ProyekRingkas } from "./project-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FilterProyek = {
  kata_kunci?: string;
  status?: string;
  dinas?: string;
  mulai?: string;
  selesai?: string;
  tanpa_vendor?: boolean;
  limit?: number;
};

/** The database applies role limits from the actor's profile, so callers cannot widen them. */
export async function daftarProyek(session: AuthSession, filter: FilterProyek = {}): Promise<ProyekRingkas[]> {
  const { data, error } = await adminDb().rpc("daftar_proyek", {
    p_actor: session.userId,
    p_kata_kunci: filter.kata_kunci ?? null,
    p_status: filter.status ?? null,
    p_dinas: filter.dinas ?? null,
    p_mulai: filter.mulai ?? null,
    p_selesai: filter.selesai ?? null,
    p_tanpa_vendor: filter.tanpa_vendor ?? false,
    p_limit: filter.limit ?? 20,
  });
  if (error) throw new Error(`daftar_proyek failed: ${error.code}`);
  return (data ?? []) as ProyekRingkas[];
}

export async function detailProyek(session: AuthSession, id: string): Promise<ProyekDetail | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await adminDb().rpc("detail_proyek", { p_actor: session.userId, p_project_id: id });
  if (error) throw new Error(`detail_proyek failed: ${error.code}`);
  return (data ?? null) as ProyekDetail | null;
}

/** Finds one project by number or title within what the actor may see. */
export async function temukanProyek(session: AuthSession, proyek: string) {
  const hasil = await daftarProyek(session, { kata_kunci: proyek, limit: 4 });
  if (hasil.length === 0) return { proyek: null, kandidat_lain: [] as string[] };
  return {
    proyek: await detailProyek(session, hasil[0].id),
    kandidat_lain: hasil.slice(1).map((item) => item.judul),
  };
}

export async function daftarPenugasan(
  session: AuthSession,
  filter: { kata_kunci?: string; status?: string } = {},
): Promise<PenugasanRingkas[]> {
  const { data, error } = await adminDb().rpc("daftar_penugasan", {
    p_actor: session.userId,
    p_kata_kunci: filter.kata_kunci ?? null,
    p_status: filter.status ?? null,
    p_limit: 200,
  });
  if (error) throw new Error(`daftar_penugasan failed: ${error.code}`);
  return (data ?? []) as PenugasanRingkas[];
}

export async function daftarOpd() {
  const { data, error } = await adminDb().from("opd").select("id, kode, nama").order("nama");
  if (error) throw new Error(`opd failed: ${error.code}`);
  return data ?? [];
}
