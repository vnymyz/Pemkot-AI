import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { rekomendasiByNama } from "@/lib/services/recommendation";

export function rekomendasikanVendorTool(session: AuthSession) {
  return tool({
    description:
      "Get the database ranking of vendors ready for one project, with the score breakdown, plus vendors that failed and their reasons. Use it for who is ready, why a vendor ranks high, and why a vendor is not included. For a follow-up, take the project from the conversation. The interface shows the result as a card.",
    inputSchema: z.object({
      proyek: z.string().min(2).max(120).describe("Project title or number, taken from the conversation if not repeated"),
      vendor: z.string().max(120).optional().describe("Only when the question is about one specific vendor"),
      jumlah: z.number().int().min(1).max(10).optional().describe("How many top vendors to show. Default 5"),
    }),
    execute: async ({ proyek, vendor, jumlah }) => {
      try {
        const hasil = await rekomendasiByNama(session, proyek);
        if (!hasil) return { error: "Proyek tidak ditemukan. Tanyakan nama proyek kepada pengguna." };

        const dasar = { sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
        const nama = vendor?.trim().toLowerCase();
        if (nama) {
          const cocok = (item: { nama: string }) => item.nama.toLowerCase().includes(nama);
          const ready = hasil.ready.filter(cocok);
          const gugur = hasil.gugur.filter(cocok);
          if (ready.length || gugur.length) return { ...hasil, ...dasar, ready, gugur, fokus: true };
          return {
            ...hasil,
            ...dasar,
            ready: hasil.ready.slice(0, jumlah ?? 5),
            catatan: "Vendor yang ditanyakan tidak ada pada hasil proyek ini. Vendor mungkin tidak menawarkan kategori yang dibutuhkan, atau namanya berbeda.",
          };
        }
        return { ...hasil, ...dasar, ready: hasil.ready.slice(0, jumlah ?? 5) };
      } catch (error) {
        console.error("[tool] rekomendasikan_vendor:", (error as Error).message);
        return { error: "Rekomendasi sedang gagal dihitung. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
