import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { SUMBER_DOKUMEN } from "@/lib/documents/types";
import { buatPowerPoint, DocumentError } from "@/lib/services/document";
import { DOCUMENT_ERRORS } from "./buat-excel";

export function buatPowerPointTool(session: AuthSession) {
  return tool({
    description:
      "Create a PowerPoint (.pptx) deck of 5 slides from database data and save it. The server fetches the data itself, so never type data into this tool. Sources: rekomendasi_proyek (needs proyek), proyek_tanpa_vendor, vendor_sertifikat_hampir_habis, daftar_penugasan, profil_vendor_saya (vendor accounts only). The deck always has 5 slides. The interface shows a download card.",
    inputSchema: z.object({
      sumber: z.enum(SUMBER_DOKUMEN),
      proyek: z.string().min(2).max(120).optional().describe("Project title or number, only for rekomendasi_proyek"),
    }),
    execute: async (input) => {
      try {
        const berkas = await buatPowerPoint(session, input);
        return { berkas };
      } catch (error) {
        if (error instanceof DocumentError && DOCUMENT_ERRORS[error.message]) return { error: DOCUMENT_ERRORS[error.message] };
        console.error("[tool] buat_powerpoint:", error instanceof Error ? error.message : "unknown error");
        return { error: "Berkas PowerPoint gagal dibuat. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
