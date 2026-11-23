import type { DokumenJenis } from "@/lib/vendor-document-schema";

export type StatusCek = "belum" | "lengkap" | "tidak_cocok" | "perlu_diperiksa_manual";

export type DokumenVendorRow = {
  id: string;
  jenis: DokumenJenis;
  nama_file: string;
  status_cek: StatusCek;
  catatan: string | null;
  diputuskan_manual: boolean;
  created_at: string;
};
