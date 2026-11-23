import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { temukanProyek } from "@/lib/services/project";

export function detailProyekTool(session: AuthSession) {
  return tool({
    description:
      "Show one project by title or number: requirements, period, budget, and assigned vendors. The interface shows the result as a card.",
    inputSchema: z.object({
      proyek: z.string().min(2).max(120).describe("Project title or number"),
    }),
    execute: async ({ proyek }) => {
      try {
        const hasil = await temukanProyek(session, proyek);
        if (!hasil.proyek) return { error: "Proyek tidak ditemukan." };
        return { ...hasil, sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
      } catch (error) {
        console.error("[tool] detail_proyek:", (error as Error).message);
        return { error: "Detail proyek sedang gagal dibaca. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
