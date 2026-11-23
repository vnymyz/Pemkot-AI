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

type Hitung = { jumlah: number };
export type AnalitikData = {
  role: string;
  kpi: Record<string, number | null>;
  proyek_status?: (Hitung & { status: string })[];
  proyek_prioritas?: (Hitung & { prioritas: string })[];
  penugasan_status: (Hitung & { status: string })[];
  nilai_bulanan: { bulan: string; nilai: number; jumlah: number }[];
  keputusan?: { jenis: string; menunggu: number; disetujui: number; ditolak: number }[];
  vendor_status?: (Hitung & { status: string })[];
  vendor_wilayah?: (Hitung & { wilayah: string })[];
  vendor_kategori?: (Hitung & { kategori: string })[];
  anggaran_opd?: { opd: string; anggaran: number; nilai: number }[];
  kapasitas?: { nama: string; kapasitas: number; terpakai: number }[];
  vendor_terbaik?: { nama: string; rata: number; jumlah: number; tepat_waktu_persen: number }[];
  sertifikat?:
    | { kedaluwarsa: number; hari_30: number; hari_60: number; hari_90: number; daftar: { vendor: string; jenis: string; berlaku_sampai: string; sisa_hari: number }[] }
    | { jenis: string; berlaku_sampai: string; sisa_hari: number }[];
  penilaian?: { nomor: string; judul: string; skor: number; tepat_waktu: boolean }[];
  dokumen?: { jenis: string; status: string }[];
};

/** Chart numbers for the dashboard, counted in the database (analitik_dashboard). */
export async function analitikDashboard(session: AuthSession): Promise<AnalitikData> {
  const { data, error } = await adminDb().rpc("analitik_dashboard", { p_actor: session.userId });
  if (error) throw new Error(`analitik_dashboard failed: ${error.code}`);
  return data as AnalitikData;
}
