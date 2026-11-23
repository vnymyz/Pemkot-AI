export type VendorSiap = {
  vendor_id: string;
  nama: string;
  status: string;
  wilayah: string | null;
  peringkat: number;
  skor: number;
  s_pengalaman: number;
  s_kinerja: number;
  s_waktu: number;
  s_kapasitas: number;
  s_harga: number;
  s_wilayah: number;
  proyek_paralel: number;
  kapasitas_proyek: number;
  sisa_proyek: number;
  total_tenaga: number;
  tenaga_terpakai: number;
  sisa_tenaga: number;
  tenaga_dibutuhkan: number;
  belum_ada_riwayat: boolean;
  jumlah_pengalaman: number;
  rating: number | null;
  tepat_waktu_persen: number | null;
  sertifikat_wajib: string[];
};

export type VendorGugur = {
  vendor_id: string;
  nama: string;
  status: string;
  alasan_gugur: string[];
};

export type Rekomendasi = {
  proyek: {
    id: string;
    nomor: string;
    judul: string;
    status: string;
    mulai: string;
    selesai: string;
    anggaran: number | null;
    wilayah: string | null;
    opd: string;
  };
  kebutuhan: { kategori: string; tenaga_min: number; sertifikat_wajib: string[] }[];
  jumlah_ready: number;
  jumlah_gugur: number;
  ready: VendorSiap[];
  gugur: VendorGugur[];
  alasan_terbanyak: { alasan: string; jumlah: number }[];
};

export type Ketersediaan = {
  vendor_id: string;
  nama: string;
  status: string;
  mulai: string;
  selesai: string;
  tenaga_diminta: number;
  bisa: boolean;
  alasan: string[];
  proyek_paralel: number;
  kapasitas_proyek: number;
  sisa_proyek: number;
  total_tenaga: number;
  tenaga_terpakai: number;
  sisa_tenaga: number;
  periode_bentrok: { mulai: string; selesai: string; alasan: string | null }[];
  sertifikat_habis_sebelum_selesai: string[];
};
