import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { SUMBER_DOKUMEN } from "@/lib/documents/types";
import { buatExcel, DocumentError } from "@/lib/services/document";

export const DOCUMENT_ERRORS: Record<string, string> = {
  akses_ditolak: "Akun ini tidak memiliki akses untuk membuat berkas tersebut.",
  proyek_diperlukan: "Nama proyek diperlukan untuk sumber data ini. Tanyakan nama proyek kepada pengguna.",
  proyek_tidak_ditemukan: "Proyek tidak ditemukan. Tanyakan nama proyek kepada pengguna.",
  tidak_ada_data: "Tidak ada data untuk dimasukkan ke berkas. Sampaikan hal ini kepada pengguna.",
};

export function buatExcelTool(session: AuthSession) {
  return tool({
    description:
      "Create an Excel (.xlsx) file from database data and save it. The server fetches the rows itself, so never type data into this tool. Sources: rekomendasi_proyek (needs proyek), proyek_tanpa_vendor, vendor_sertifikat_hampir_habis, daftar_penugasan, profil_vendor_saya (vendor accounts only). The interface shows a download card.",
    inputSchema: z.object({
      sumber: z.enum(SUMBER_DOKUMEN),
      proyek: z.string().min(2).max(120).optional().describe("Project title or number, only for rekomendasi_proyek"),
    }),
    execute: async (input) => {
      try {
        const berkas = await buatExcel(session, input);
        return { berkas };
      } catch (error) {
        if (error instanceof DocumentError && DOCUMENT_ERRORS[error.message]) return { error: DOCUMENT_ERRORS[error.message] };
        console.error("[tool] buat_excel:", error instanceof Error ? error.message : "unknown error");
        return { error: "Berkas Excel gagal dibuat. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
