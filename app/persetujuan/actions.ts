"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { ApprovalError, putuskanPersetujuan } from "@/lib/services/approval";

export type PersetujuanState = { error: string | null; success: string | null };

export async function putuskan(
  _previous: PersetujuanState,
  formData: FormData,
): Promise<PersetujuanState> {
  const state = await getSessionState();
  if (state.status !== "ready") return { error: "Sesi tidak tersedia.", success: null };

  const approvalId = String(formData.get("approval_id") ?? "");
  const setuju = formData.get("keputusan") === "setuju";
  const catatan = String(formData.get("catatan") ?? "").slice(0, 1000);

  try {
    const result = await putuskanPersetujuan(state.session, approvalId, setuju, catatan);
    revalidatePath("/persetujuan");
    revalidatePath("/penugasan");
    revalidatePath("/proyek");
    revalidatePath("/vendor");
    if (result === "sudah_diputuskan") {
      return { error: "Usulan ini sudah diputuskan sebelumnya.", success: null };
    }
    return {
      error: null,
      success: setuju ? "Usulan disetujui." : "Usulan ditolak.",
    };
  } catch (error) {
    if (error instanceof ApprovalError) {
      const pesan: Record<string, string> = {
        akses_ditolak: "Akun ini tidak memiliki akses menyetujui usulan.",
        kapasitas_tidak_cukup: "Persetujuan gagal: kapasitas vendor sudah tidak cukup.",
        vendor_memiliki_penugasan_aktif: "Vendor memiliki usulan atau penugasan aktif dan belum dapat diarsipkan.",
        vendor_tidak_valid: "Data vendor tidak lagi dapat diperbarui.",
        kategori_tidak_valid: "Persetujuan gagal: salah satu kategori layanan tidak lagi tersedia. Data vendor lama tetap utuh.",
        npwp_terdaftar: "NPWP sudah digunakan vendor lain.",
        data_tidak_valid: "Usulan tidak valid.",
      };
      return { error: pesan[error.message] ?? "Keputusan tidak dapat disimpan.", success: null };
    }
    return { error: "Keputusan tidak dapat disimpan. Silakan coba lagi.", success: null };
  }
}
