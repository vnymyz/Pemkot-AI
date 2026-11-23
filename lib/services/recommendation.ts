import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import { daftarProyek } from "./project";
import type { Rekomendasi } from "./recommendation-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Scores and ranking come from the database. This service never changes them. */
export async function rekomendasiProyek(session: AuthSession, projectId: string): Promise<Rekomendasi | null> {
  if (session.role === "vendor" || !UUID.test(projectId)) return null;
  const { data, error } = await adminDb().rpc("rekomendasi_vendor_proyek", {
    p_actor: session.userId,
    p_project_id: projectId,
  });
  if (error) throw new Error(`rekomendasi_vendor_proyek failed: ${error.code}`);
  return (data ?? null) as Rekomendasi | null;
}

export async function rekomendasiByNama(session: AuthSession, proyek: string) {
  if (session.role === "vendor") return null;
  const hasil = await daftarProyek(session, { kata_kunci: proyek, limit: 1 });
  return hasil[0] ? rekomendasiProyek(session, hasil[0].id) : null;
}
