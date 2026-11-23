import { z } from "zod";

export const VENDOR_STATUS = ["draft", "verifikasi", "aktif", "ditolak", "daftar_hitam", "diarsipkan"] as const;
export const VENDOR_TIPE = ["barang", "jasa", "barang_jasa"] as const;

const layananSchema = z
  .object({
    category_id: z.number().int().positive(),
    nama_layanan: z.string().trim().min(2).max(120),
    deskripsi: z.string().trim().max(300).optional().default(""),
    harga_min: z.number().min(0).max(1e13),
    harga_maks: z.number().min(0).max(1e13),
    satuan: z.string().trim().min(1).max(30),
  })
  .refine((item) => item.harga_maks >= item.harga_min, { message: "harga_maks" });

export const draftVendorSchema = z.object({
  nama: z.string().trim().min(3).max(120),
  npwp: z
    .string()
    .trim()
    .max(25)
    .refine((value) => /^[\d.\-\s]+$/.test(value) && [15, 16].includes(value.replace(/\D/g, "").length)),
  alamat: z.string().trim().min(5).max(200),
  wilayah: z.string().trim().min(2).max(80),
  kontak: z.string().trim().min(3).max(120),
  tipe: z.enum(VENDOR_TIPE),
  kapasitas_proyek: z.number().int().min(1).max(100),
  total_tenaga: z.number().int().min(1).max(100000),
  layanan: z.array(layananSchema).min(1).max(10),
});

export type DraftVendor = z.infer<typeof draftVendorSchema>;
