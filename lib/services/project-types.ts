export const PROJECT_STATUS = ["rencana", "mencari_vendor", "berjalan", "selesai", "ditunda", "dibatalkan"] as const;
export const ASSIGNMENT_STATUS = ["diusulkan", "disetujui", "berjalan", "selesai", "dibatalkan"] as const;

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  rencana: "Rencana",
  mencari_vendor: "Mencari vendor",
  berjalan: "Berjalan",
  selesai: "Selesai",
  ditunda: "Ditunda",
  dibatalkan: "Dibatalkan",
};

export const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  diusulkan: "Menunggu",
  disetujui: "Disetujui",
  berjalan: "Berjalan",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const PRIORITAS_LABEL: Record<string, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
};

export type ProyekRingkas = {
  id: string;
  nomor: string;
  judul: string;
  opd_id: number;
  opd: string;
  status: string;
  mulai: string;
  selesai: string;
  anggaran: number | null;
  wilayah: string | null;
  prioritas: string | null;
  kategori: string[];
  tenaga_min: number;
  sertifikat_wajib: string[];
  vendor: string[];
  jumlah_usulan: number;
  relevansi: number;
};

export type PenugasanProyek = {
  id: string;
  vendor_id: string;
  vendor: string;
  status: string;
  tenaga_dialokasikan: number;
  mulai: string;
  selesai: string;
  nilai: number | null;
};

export type ProyekDetail = {
  id: string;
  nomor: string;
  judul: string;
  deskripsi: string | null;
  opd: string;
  status: string;
  mulai: string;
  selesai: string;
  anggaran: number | null;
  wilayah: string | null;
  prioritas: string | null;
  kebutuhan: { kategori: string; tenaga_min: number; sertifikat_wajib: string[]; catatan: string | null }[];
  penugasan: PenugasanProyek[];
};

export type PenugasanRingkas = {
  id: string;
  project_id: string;
  nomor: string;
  judul: string;
  opd: string;
  vendor_id: string;
  vendor: string;
  status: string;
  tenaga_dialokasikan: number;
  mulai: string;
  selesai: string;
  nilai: number | null;
};
