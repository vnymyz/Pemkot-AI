export type VendorRingkas = {
  id: string;
  nama: string;
  npwp: string | null;
  wilayah: string | null;
  tipe: string;
  status: string;
  kapasitas_proyek: number;
  total_tenaga: number;
  kategori: string[];
  layanan: string[];
  harga_min: number | null;
  harga_maks: number | null;
  sertifikat_berlaku: string[];
  rating: number | null;
  jumlah_penilaian: number;
  relevansi: number;
};

export type VendorDetail = {
  id: string;
  nama: string;
  npwp: string | null;
  alamat: string | null;
  wilayah: string | null;
  kontak: string | null;
  tipe: string;
  status: string;
  kapasitas_proyek: number;
  total_tenaga: number;
  diperbarui: string;
  beban: { proyek_berjalan: number; tenaga_terpakai: number; sisa_proyek: number; sisa_tenaga: number };
  penilaian: { rata_rata: number | null; jumlah: number; tepat_waktu_persen: number | null };
  layanan: {
    id: string;
    category_id: number;
    kategori: string;
    nama_layanan: string;
    tipe: string;
    deskripsi: string | null;
    harga_min: number | null;
    harga_maks: number | null;
    satuan: string | null;
  }[];
  sertifikat: {
    jenis: string;
    nomor: string | null;
    berlaku_sampai: string;
    sisa_hari: number;
    status_berlaku: "berlaku" | "hampir_habis" | "kedaluwarsa";
  }[];
  tidak_tersedia: { mulai: string; selesai: string; alasan: string | null }[];
  dokumen: { jenis: string; status_cek: string }[];
  riwayat: { nomor: string; judul: string; status: string; mulai: string; selesai: string }[];
  peringatan: string[];
};

export type Kategori = { id: number; nama: string; tipe: string };

export type FormDaftarOutput =
  | {
      mode: "baru" | "perbarui" | "ajukan_perubahan";
      vendor_id: string | null;
      prefill: {
        nama?: string;
        npwp?: string;
        alamat?: string;
        wilayah?: string;
        kontak?: string;
        tipe?: string;
        kapasitas_proyek?: number;
        total_tenaga?: number;
        layanan?: {
          category_id: number;
          nama_layanan: string;
          deskripsi?: string;
          harga_min: number | null;
          harga_maks: number | null;
          satuan: string;
        }[];
      };
      kategori: Kategori[];
    }
  | { mode: "tidak_bisa"; status: string; pesan: string };
