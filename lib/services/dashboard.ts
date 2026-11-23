import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";

export type DashboardData = {
  role: string;
  proyek_tanpa_vendor?: number;
  usulan_menunggu?: number;
  usulan_tertua?: string | null;
  berkas_saya?: number;
  vendor_verifikasi?: number;
  vendor_aktif?: number;
  sertifikat_hampir_habis?: number;
  vendor_status?: string | null;
  dokumen_wajib?: number;
  dokumen_lengkap?: number;
  penugasan_aktif?: number;
  penugasan_selesai?: number;
};

/** Every number is counted in the database (ringkasan_dashboard). The page only shows it. */
export async function ringkasanDashboard(session: AuthSession): Promise<DashboardData> {
  const { data, error } = await adminDb().rpc("ringkasan_dashboard", { p_actor: session.userId });
  if (error) throw new Error(`ringkasan_dashboard failed: ${error.code}`);
  return data as DashboardData;
}
