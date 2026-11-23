import type { Role } from "@/lib/auth/roles";

export type TourStep = {
  /** Page the step belongs to. A path that starts with it counts too (for example /vendor/abc for /vendor). */
  path: string;
  /** CSS selector of the thing to point at. When it is missing, the card shows in the middle of the screen. */
  target?: string;
  title: string;
  text: string;
};

const MENU = (href: string) => `nav[aria-label="Menu utama"] a[href="${href}"]`;
const BELL = 'button[aria-label^="Notifikasi"]';

/**
 * One short journey per role. Each step points at something real on the page and says
 * what it is for. The tour moves between pages by itself.
 */
export const TOUR: Record<Role, TourStep[]> = {
  admin_pengadaan: [
    {
      path: "/dashboard",
      target: 'section[aria-labelledby="tugas"]',
      title: "Mulai dari sini",
      text: "Setiap kartu adalah pekerjaan yang menunggu Bapak/Ibu, lengkap dengan angkanya. Tombol di kartu membawa langsung ke tempat pekerjaannya.",
    },
    {
      path: "/dashboard",
      target: MENU("/vendor"),
      title: "Menu Vendor",
      text: "Semua perusahaan penyedia ada di sini. Bapak/Ibu bisa mencari, membuka detail, dan menyiapkan vendor baru.",
    },
    {
      path: "/vendor",
      target: 'form[role="search"]',
      title: "Cari dan saring",
      text: "Hasil berubah saat Bapak/Ibu mengetik. Saring menurut kategori, status, atau tipe. Tombol Hapus filter mengembalikan semuanya.",
    },
    {
      path: "/vendor",
      target: 'a[href="/vendor/baru"]',
      title: "Tambah vendor baru",
      text: "Vendor baru dimulai sebagai draft. Setelah NIB, NPWP, dan Akta lengkap, kirim untuk verifikasi, lalu ajukan aktivasi ke Kepala Dinas.",
    },
    {
      path: "/proyek",
      target: "table.ledger",
      title: "Pilih proyek",
      text: "Buka satu proyek, lalu tekan Lihat vendor yang siap. Daftarnya sudah diurutkan dengan skor dan alasan.",
    },
    {
      path: "/chat",
      target: '[data-tour="chat-saran"]',
      title: "Tanya Asisten AI",
      text: "Tekan salah satu contoh atau tulis pertanyaan sendiri. Asisten menjawab dari data sistem. Usulan yang disiapkannya tetap menunggu persetujuan.",
    },
    {
      path: "/berkas",
      target: "main h1",
      title: "Berkas buatan Asisten",
      text: "File Word, Excel, dan PowerPoint yang Bapak/Ibu minta lewat chat tersimpan di sini. Tautan unduh berlaku 1 jam.",
    },
    {
      path: "/dashboard",
      target: BELL,
      title: "Pemberitahuan",
      text: "Lonceng menunjukkan usulan yang perlu diperhatikan. Panduan ini bisa dibuka lagi kapan saja lewat Panduan singkat di menu kiri.",
    },
  ],

  pic_proyek: [
    {
      path: "/dashboard",
      target: 'section[aria-labelledby="tugas"]',
      title: "Mulai dari sini",
      text: "Kartu ini menunjukkan proyek dinas Bapak/Ibu yang belum punya vendor dan usulan yang masih menunggu keputusan.",
    },
    {
      path: "/proyek",
      target: "table.ledger",
      title: "Proyek dinas Bapak/Ibu",
      text: "Hanya proyek dinas Bapak/Ibu yang tampil. Buka satu proyek, lalu tekan Lihat vendor yang siap.",
    },
    {
      path: "/chat",
      target: '[data-tour="chat-saran"]',
      title: "Tanya Asisten AI",
      text: "Contohnya: siapa yang siap untuk sebuah proyek, atau kenapa satu vendor tidak masuk daftar. Jawabannya memakai skor dari database.",
    },
    {
      path: "/chat",
      target: '[data-tour="chat-tulis"]',
      title: "Ajukan penugasan",
      text: "Tulis, misalnya, Tugaskan PT Karya Bangun ke Renovasi Gedung Dinas. Asisten menyiapkan kartu usulan. Bapak/Ibu meninjau dan mengonfirmasinya.",
    },
    {
      path: "/penugasan",
      target: "table.ledger",
      title: "Pantau usulan",
      text: "Usulan berstatus Menunggu sampai Kepala Dinas memutuskan. Setelah disetujui, statusnya berubah di sini.",
    },
    {
      path: "/berkas",
      target: "main h1",
      title: "Berkas",
      text: "Minta Asisten membuat Word, Excel, atau PowerPoint dari data proyek dinas Bapak/Ibu. Hasilnya tersimpan di halaman ini.",
    },
  ],

  kepala_dinas: [
    {
      path: "/dashboard",
      target: 'section[aria-labelledby="tugas"]',
      title: "Mulai dari sini",
      text: "Kartu pertama menunjukkan usulan yang menunggu keputusan Bapak/Ibu, lengkap dengan tanggal usulan tertua.",
    },
    {
      path: "/persetujuan",
      target: "main article",
      title: "Baca rincian usulan",
      text: "Setiap usulan memuat vendor, proyek, nilai, dan pengusulnya. Tulis catatan bila perlu, lalu Setujui atau Tolak.",
    },
    {
      path: "/penugasan",
      target: "table.ledger",
      title: "Hasil keputusan",
      text: "Usulan yang disetujui berubah menjadi penugasan. Kapasitas vendor dicek ulang saat persetujuan, jadi tidak ada penugasan ganda.",
    },
    {
      path: "/proyek",
      target: "table.ledger",
      title: "Semua proyek",
      text: "Bapak/Ibu dapat melihat proyek semua dinas dan vendor yang siap untuk masing-masing.",
    },
    {
      path: "/chat",
      target: '[data-tour="chat-saran"]',
      title: "Tanya Asisten AI",
      text: "Minta ringkasan, misalnya proyek yang belum punya vendor atau sertifikat yang hampir habis. Bapak/Ibu juga dapat meminta file Word, Excel, atau PowerPoint.",
    },
    {
      path: "/berkas",
      target: "main h1",
      title: "Berkas",
      text: "Bapak/Ibu dapat melihat berkas buatan semua pengguna. Tautan unduh dibuat saat diklik dan berlaku 1 jam.",
    },
  ],

  vendor: [
    {
      path: "/dashboard",
      target: 'section[aria-labelledby="tugas"]',
      title: "Mulai dari sini",
      text: "Kartu ini menunjukkan dokumen wajib yang belum lengkap dan penugasan yang sedang berjalan untuk vendor Bapak/Ibu.",
    },
    {
      path: "/vendor",
      target: 'ol[aria-label="Tahap vendor"]',
      title: "Tahap vendor",
      text: "Draft, Verifikasi, lalu Aktif. Tahap yang sedang berjalan ditandai Sekarang. Kalimat di atasnya menjelaskan langkah berikutnya.",
    },
    {
      path: "/vendor",
      target: '[data-tour="dokumen"]',
      title: "Unggah dokumen",
      text: "Unggah NIB, NPWP, dan Akta. Dokumen diperiksa otomatis, lalu oleh Admin. Setelah ketiganya lengkap, kirim untuk verifikasi.",
    },
    {
      path: "/penugasan",
      target: "main h1",
      title: "Penugasan Saya",
      text: "Pekerjaan yang sudah disetujui untuk vendor Bapak/Ibu muncul di sini.",
    },
    {
      path: "/chat",
      target: '[data-tour="chat-saran"]',
      title: "Tanya Asisten AI",
      text: "Tanyakan data vendor Bapak/Ibu sendiri, misalnya status dan kapasitas. Data vendor lain tidak dapat dilihat.",
    },
    {
      path: "/berkas",
      target: "main h1",
      title: "Berkas",
      text: "Minta Asisten membuat Word, Excel, atau PowerPoint dari profil vendor Bapak/Ibu. Hasilnya tersimpan di halaman ini.",
    },
  ],
};
