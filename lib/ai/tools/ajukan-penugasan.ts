import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { temukanProyek } from "@/lib/services/project";
import { temukanVendor } from "@/lib/services/vendor";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function ajukanPenugasanTool(session: AuthSession) {
  return tool({
    description:
      "Prepare an assignment proposal preview from an already ranked ready vendor. This tool does not write data. The user must confirm the preview card before the proposal is created.",
    inputSchema: z.object({
      proyek: z.string().min(2).max(120),
      vendor: z.string().min(2).max(120),
      tenaga: z.number().int().min(0).max(100000),
      mulai: tanggal,
      selesai: tanggal,
      nilai: z.number().min(0).optional(),
    }),
    execute: async (input) => {
      try {
        const proyek = await temukanProyek(session, input.proyek);
        if (!proyek.proyek) return { error: "Proyek tidak ditemukan. Tanyakan nama proyek kepada pengguna." };
        const vendor = await temukanVendor(session, { nama: input.vendor });
        if (!vendor.vendor) return { error: "Vendor tidak ditemukan. Tanyakan nama vendor kepada pengguna." };

        return {
          status: "konfirmasi_diperlukan" as const,
          project_id: proyek.proyek.id,
          vendor_id: vendor.vendor.id,
          proyek: proyek.proyek.judul,
          vendor: vendor.vendor.nama,
          tenaga: input.tenaga,
          mulai: input.mulai,
          selesai: input.selesai,
          nilai: input.nilai ?? null,
        };
      } catch (error) {
        console.error("[tool] ajukan_penugasan preview:", error instanceof Error ? error.message : "unknown error");
        return { error: "Pratinjau usulan penugasan tidak tersedia. Silakan coba lagi." };
      }
    },
  });
}
