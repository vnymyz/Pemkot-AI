import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { temukanVendor } from "@/lib/services/vendor";

export function cekVendorTool(session: AuthSession) {
  const own = session.role === "vendor";
  return tool({
    description: own
      ? "Show this account's own vendor profile: catalog, certificates, capacity, history, and warnings."
      : "Show one vendor's full profile by name or NPWP: catalog, certificates, capacity, history, ratings, and warnings.",
    inputSchema: z.object({
      nama: z.string().max(120).optional().describe("Vendor name"),
      npwp: z.string().max(25).optional(),
    }),
    execute: async ({ nama, npwp }) => {
      try {
        const { vendor, kandidat_lain } = await temukanVendor(session, { nama, npwp });
        if (!vendor) return { error: "Vendor tidak ditemukan." };
        return { vendor, kandidat_lain, sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
      } catch (error) {
        console.error("[tool] cek_vendor:", (error as Error).message);
        return { error: "Data vendor sedang gagal dibaca. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
