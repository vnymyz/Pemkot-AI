import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { SUMBER_DOKUMEN } from "@/lib/documents/types";
import { tanggalHariIni } from "@/lib/format";
import { DocumentError, ringkasData } from "@/lib/services/document";
import { DOCUMENT_ERRORS } from "./buat-excel";

export function ringkasDataTool(session: AuthSession) {
  return tool({
    description:
      "Get a short summary of a named data source: counts, key figures, and a few sample rows. Use it when the user asks for a summary or key points. The counts come from the database, so only phrase them.",
    inputSchema: z.object({
      sumber: z.enum(SUMBER_DOKUMEN),
      proyek: z.string().min(2).max(120).optional().describe("Project title or number, only for rekomendasi_proyek"),
    }),
    execute: async (input) => {
      try {
        return { ...(await ringkasData(session, input.sumber, input.proyek)), per_tanggal: tanggalHariIni() };
      } catch (error) {
        if (error instanceof DocumentError && DOCUMENT_ERRORS[error.message]) return { error: DOCUMENT_ERRORS[error.message] };
        console.error("[tool] ringkas_data:", error instanceof Error ? error.message : "unknown error");
        return { error: "Ringkasan gagal dibuat. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
