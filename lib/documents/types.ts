/** Named data sources. The server fetches the rows itself, so the model never copies data. */
export const SUMBER_DOKUMEN = [
  "rekomendasi_proyek",
  "proyek_tanpa_vendor",
  "vendor_sertifikat_hampir_habis",
  "daftar_penugasan",
  "profil_vendor_saya",
] as const;
export type SumberDokumen = (typeof SUMBER_DOKUMEN)[number];

export const SUMBER_LABEL: Record<SumberDokumen, string> = {
  rekomendasi_proyek: "Rekomendasi vendor",
  proyek_tanpa_vendor: "Proyek tanpa vendor",
  vendor_sertifikat_hampir_habis: "Sertifikat vendor hampir habis",
  daftar_penugasan: "Daftar penugasan",
  profil_vendor_saya: "Profil vendor saya",
};

export type JenisBerkas = "xlsx" | "pptx" | "docx";

export type Format = "teks" | "angka" | "desimal" | "rupiah" | "tanggal";
export type Kolom = { header: string; key: string; format?: Format };
/** Dates are ISO strings (YYYY-MM-DD). The builders turn them into real date cells. */
export type Sel = string | number | null;
export type Baris = Record<string, Sel>;
export type Lembar = { nama: string; kolom: Kolom[]; baris: Baris[] };

export type DokumenData = {
  sumber: SumberDokumen;
  judul: string;
  subjudul: string;
  /** Creation date, YYYY-MM-DD, Asia/Jakarta. */
  dibuat: string;
  lembar: Lembar[];
  ringkasan: { label: string; nilai: string }[];
  kesimpulan: string[];
  grafik: { judul: string; label: string[]; nilai: number[]; maks: number } | null;
  /** Short project number used in the file name. */
  kode: string | null;
};

export const totalBaris = (data: DokumenData) => data.lembar.reduce((sum, item) => sum + item.baris.length, 0);

export const JUMLAH_SLIDE = 5;

export type BerkasRow = {
  id: string;
  nama: string;
  jenis: JenisBerkas;
  sumber: string;
  baris: number | null;
  slide: number | null;
  dibuat_oleh: string;
  created_at: string;
};
