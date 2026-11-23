import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { daftarProyek } from "@/lib/services/project";
import { PROJECT_STATUS } from "@/lib/services/project-types";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function daftarProyekTool(session: AuthSession) {
  return tool({
    description:
      "List projects the user may see. Filter by keyword, status, agency, period, or projects without a vendor. The interface shows the results as cards.",
    inputSchema: z.object({
      kata_kunci: z.string().max(120).optional().describe("Project title or number"),
      status: z.enum(PROJECT_STATUS).optional(),
      dinas: z.string().max(80).optional().describe("Agency name, only when the user names one"),
      periode_mulai: tanggal.optional().describe("Start of the period, YYYY-MM-DD"),
      periode_selesai: tanggal.optional().describe("End of the period, YYYY-MM-DD"),
      tanpa_vendor: z.boolean().optional().describe("True for open projects with no approved vendor yet"),
    }),
    execute: async ({ periode_mulai, periode_selesai, ...filter }) => {
      try {
        const proyek = await daftarProyek(session, { ...filter, mulai: periode_mulai, selesai: periode_selesai, limit: 8 });
        return { jumlah: proyek.length, proyek, sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
      } catch (error) {
        console.error("[tool] daftar_proyek:", (error as Error).message);
        return { error: "Daftar proyek sedang gagal dibaca. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
