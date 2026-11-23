import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { tanggalHariIni } from "@/lib/format";
import { cariVendor } from "@/lib/services/vendor";
import { VENDOR_STATUS, VENDOR_TIPE } from "@/lib/vendor-schema";

export function cariVendorTool(session: AuthSession) {
  return tool({
    description:
      "Search vendors by goods, services, name, category, type, or region. Handles small typos. Defaults to active vendors. The interface shows the results as cards.",
    inputSchema: z.object({
      kata_kunci: z.string().max(100).optional().describe("Goods, service, or vendor name, e.g. 'printer laser', 'jasa kebersihan'"),
      kategori: z
        .enum([
          "Konstruksi bangunan",
          "Jasa kebersihan",
          "Pengadaan alat kesehatan",
          "TI dan perangkat",
          "Furnitur",
          "Kendaraan",
          "Konsultan",
          "Jasa keamanan",
        ])
        .optional(),
      tipe: z.enum(VENDOR_TIPE).optional(),
      wilayah: z.string().max(80).optional().describe("Only when the user names a region"),
      status: z
        .enum([...VENDOR_STATUS, "semua"])
        .optional()
        .describe("Default aktif. Use semua for every non-archived status; use diarsipkan only when requested."),
    }),
    execute: async ({ status, ...filter }) => {
      try {
        const vendor = await cariVendor(session, {
          ...filter,
          status: status === "semua" ? null : (status ?? "aktif"),
          limit: 8,
        });
        return { jumlah: vendor.length, vendor, sumber: "Database Pemkot-AI", per_tanggal: tanggalHariIni() };
      } catch (error) {
        console.error("[tool] cari_vendor:", (error as Error).message);
        return { error: "Pencarian vendor sedang gagal. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
