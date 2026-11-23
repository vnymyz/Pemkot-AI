import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { AvailabilityError, cekKetersediaan } from "@/lib/services/availability";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function cekKetersediaanVendorTool(session: AuthSession) {
  const own = session.role === "vendor";
  return tool({
    description: own
      ? "Check whether this account's own vendor can take work in a period, with remaining capacity and reasons."
      : "Check whether one vendor can take work in a period, with remaining capacity and reasons.",
    inputSchema: z.object({
      vendor: z.string().max(120).optional().describe(own ? "Leave empty" : "Vendor name"),
      mulai: tanggal.describe("Start date, YYYY-MM-DD"),
      selesai: tanggal.describe("End date, YYYY-MM-DD"),
      tenaga: z.number().int().min(0).max(100000).optional().describe("Workers needed, only if the user states it"),
    }),
    execute: async (input) => {
      try {
        const ketersediaan = await cekKetersediaan(session, input);
        if (!ketersediaan) return { error: "Vendor tidak ditemukan." };
        return { ketersediaan, sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
      } catch (error) {
        if (error instanceof AvailabilityError && error.message === "periode_tidak_valid") {
          return { error: "Periode tidak valid. Tanggal selesai harus sama atau setelah tanggal mulai." };
        }
        console.error("[tool] cek_ketersediaan_vendor:", (error as Error).message);
        return { error: "Ketersediaan vendor sedang gagal dicek. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
