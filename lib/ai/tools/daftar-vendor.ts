import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/session";
import { formDaftarVendor } from "@/lib/services/vendor";
import { VENDOR_TIPE } from "@/lib/vendor-schema";

export function daftarVendorTool(session: AuthSession) {
  return tool({
    description:
      "Open the vendor registration form in the chat. This saves nothing. The user reviews and submits the form, and the result is a draft. Prefill only values the user stated.",
    inputSchema: z.object({
      nama: z.string().max(120).optional(),
      npwp: z.string().max(25).optional(),
      alamat: z.string().max(200).optional(),
      wilayah: z.string().max(80).optional(),
      kontak: z.string().max(120).optional(),
      tipe: z.enum(VENDOR_TIPE).optional(),
    }),
    execute: async (prefill) => {
      try {
        return await formDaftarVendor(session, prefill);
      } catch (error) {
        console.error("[tool] daftar_vendor:", (error as Error).message);
        return { error: "Form pendaftaran sedang gagal dibuka. Sampaikan kepada pengguna untuk mencoba lagi." };
      }
    },
  });
}
