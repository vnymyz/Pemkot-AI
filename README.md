# Pemkot-AI

Demo website chat AI untuk membantu pemerintah kota mengelola **vendor**, melihat **proyek**, mengecek **vendor yang siap**, dan mengusulkan **penugasan**.

> **Ini demo, bukan sistem produksi. Seluruh data fiktif.** Jangan memasukkan data pemerintah asli, dokumen vendor asli, atau data pribadi.

Rencana lengkap dan sumber kebenaran proyek ada di [`docs/pemkot-AI.md`](docs/pemkot-AI.md).

## Daftar isi

**Non teknis**
1. [Ringkasan](#1-ringkasan)
2. [Status pengerjaan](#2-status-pengerjaan)
3. [Peran pengguna](#3-peran-pengguna)
4. [Alur kerja utama](#4-alur-kerja-utama)
5. [Cara sistem menilai vendor](#5-cara-sistem-menilai-vendor)
6. [Batasan demo](#6-batasan-demo)

**Teknis**

7. [Teknologi](#7-teknologi)
8. [Struktur proyek](#8-struktur-proyek)
9. [Cara menjalankan](#9-cara-menjalankan)
10. [Variabel lingkungan](#10-variabel-lingkungan)
11. [Halaman dan API](#11-halaman-dan-api)
12. [Database](#12-database)
13. [Lapisan AI](#13-lapisan-ai)
14. [Keamanan](#14-keamanan)
15. [Desain](#15-desain)
16. [Pemeriksaan dan pengujian](#16-pemeriksaan-dan-pengujian)
17. [Deploy ke Vercel](#17-deploy-ke-vercel)
18. [Masalah umum](#18-masalah-umum)
19. [Catatan teknis terbuka](#19-catatan-teknis-terbuka)
20. [Glosarium](#20-glosarium)

---

# Bagian non teknis

## 1. Ringkasan

Pengguna bertanya dengan bahasa sehari-hari, misalnya:

- "Proyek apa yang belum punya vendor?"
- "Siapa yang siap mengerjakan renovasi gedung dinas bulan Januari sampai Maret?"
- "Kenapa vendor ini direkomendasikan paling atas?"
- "Buatkan daftar rekomendasi dalam Excel dan ringkasannya dalam PowerPoint."

Tiga prinsip utama:

| Prinsip | Artinya |
|---|---|
| **Angka dari database** | Skor, kapasitas, harga, dan tanggal dihitung sistem. AI hanya menjelaskan hasilnya |
| **Manusia yang memutuskan** | AI hanya membuat usulan. Penugasan berlaku setelah disetujui Kepala Dinas |
| **Semua tercatat** | Setiap persetujuan dan penolakan masuk ke catatan audit |

## 2. Status pengerjaan

| Fase | Isi | Status |
|---|---|---|
| 0 | Kerangka aplikasi, login, peran, SQL awal, rantai model AI | **Selesai** |
| 1 | Vendor, katalog, Asisten AI, pendaftaran vendor dasar | **Selesai** |
| 2 | Proyek dan penugasan | **Selesai** |
| 3 | Mesin vendor siap, skor, dan rekomendasi | **Kode selesai, menunggu konfirmasi uji per peran** |
| 4 | Rekomendasi di chat dan persetujuan | Belum (kerangka SQL sudah ada) |
| 5 | Pembuatan Excel dan PowerPoint | Belum |
| 6 | Penyempurnaan peran dan hak akses | Belum (aturan database awal sudah ada) |
| 7 | Poles tampilan dan skrip demo | Belum |

Yang sudah bisa dibuka saat ini: beranda, login, dashboard, Asisten AI, vendor, proyek, dan penugasan. Menu Persetujuan dan Berkas masih bertanda "Segera".

## 3. Peran pengguna

| Peran | Untuk siapa | Boleh |
|---|---|---|
| **Admin Pengadaan** | Staf unit pengadaan | Mencari vendor, melihat rekomendasi, mengusulkan penugasan, mendaftarkan vendor, membuat dokumen |
| **PIC Proyek** | Penanggung jawab proyek di satu dinas | Melihat proyek dinasnya, meminta rekomendasi, mengusulkan penugasan untuk proyeknya |
| **Kepala Dinas** | Pejabat pengambil keputusan | Melihat semua data, menyetujui atau menolak usulan, membuat Excel dan PowerPoint |
| **Vendor** | Perusahaan penyedia | Hanya data vendornya sendiri dan penugasan miliknya |

Empat akun demo dibuat pada [langkah 4 cara menjalankan](#langkah-4-buat-akun-demo).

## 4. Alur kerja utama

```text
1. Pengguna bertanya siapa vendor yang siap untuk sebuah proyek
2. Database mengecek syarat wajib dan menghitung skor
3. AI menjelaskan hasilnya dengan bahasa biasa
4. Pengguna memilih vendor, lalu sistem membuat usulan penugasan
5. Kepala Dinas menyetujui atau menolak
6. Jika disetujui, sistem mengecek ulang kapasitas vendor
7. Penugasan berlaku dan tercatat di audit log
```

Kapasitas dicek ulang pada langkah 6 karena bisa saja dua proyek mengusulkan vendor yang sama. Jika slot vendor tinggal satu, hanya satu usulan yang berhasil.

## 5. Cara sistem menilai vendor

**Tahap 1: syarat wajib.** Gagal satu syarat berarti vendor tidak masuk daftar.

1. Status vendor aktif.
2. Punya layanan pada kategori yang dibutuhkan.
3. Punya semua sertifikat wajib dan masih berlaku sampai proyek selesai.
4. Tidak sedang berada di periode tidak tersedia.
5. Jumlah proyek paralel masih di bawah kapasitas.
6. Sisa tenaga kerja mencukupi.

**Tahap 2: skor 0 sampai 100.**

| Komponen | Bobot | Cara menghitung |
|---|---:|---|
| Pengalaman serupa | 25 | Jumlah proyek selesai di kategori yang sama, maksimal 5 |
| Penilaian kinerja | 25 | Rata-rata nilai kualitas skala 1 sampai 5 |
| Ketepatan waktu | 15 | Persentase proyek selesai tepat waktu |
| Sisa kapasitas | 15 | Makin longgar, makin tinggi |
| Kecocokan harga | 10 | Harga layanan sesuai anggaran |
| Wilayah | 10 | Wilayah vendor sesuai lokasi proyek |

Bobot ini masih **usulan untuk demo** dan perlu ditetapkan oleh pihak yang berwenang. Vendor baru mendapat nilai netral dan ditandai "Belum ada riwayat".

## 6. Batasan demo

Tidak termasuk dalam demo:

- Stok barang, gudang, dan pesanan barang.
- Integrasi sungguhan dengan e-katalog, SIRUP, SPSE, atau sistem keuangan daerah.
- Tender, kontrak resmi, tanda tangan digital, dan pembayaran.
- Aplikasi mobile native.

Layanan yang dipakai (Gemini, Groq, Supabase, Vercel) dapat memproses data di luar negeri. Karena itu demo ini **hanya boleh memakai data fiktif**. Versi resmi perlu pembahasan tentang UU Pelindungan Data Pribadi, SPBE, lokasi hosting, dan penilaian keamanan.

---

# Bagian teknis

## 7. Teknologi

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Tampilan | Tailwind CSS v4, `lucide-react`, IBM Plex Sans dan Mono |
| AI | Vercel AI SDK v7, Google Gemini (utama), Groq (cadangan) |
| Validasi | `zod` |
| Database dan login | Supabase Postgres, Supabase Auth, `@supabase/ssr` |
| Penyimpanan file | Supabase Storage (bucket privat) |
| Hosting | Vercel |
| Excel dan PowerPoint | `exceljs` dan `pptxgenjs` (dipasang pada Fase 5) |

## 8. Struktur proyek

Struktur saat ini (Fase 3):

```text
pemkot-AI/
├── app/
│   ├── (site)/page.tsx        Beranda
│   ├── login/                 Halaman, form, proses masuk dan keluar
│   ├── dashboard/             Informasi akun
│   ├── chat/                  Halaman Asisten AI
│   ├── vendor/                Daftar vendor dan detail vendor
│   ├── proyek/                Daftar, detail, dan rekomendasi vendor per proyek
│   ├── penugasan/             Daftar penugasan
│   ├── api/
│   │   ├── chat/              Agen AI dengan tool sesuai peran
│   │   ├── sessions/          Riwayat percakapan
│   │   └── vendor/daftar/     Menyimpan draft pendaftaran vendor
│   ├── globals.css            Token warna, tipografi, aksesibilitas
│   ├── layout.tsx             Layout utama dan font
│   └── loading.tsx            Tampilan memuat halaman
├── components/
│   ├── cards/                 Kartu vendor dan form pendaftaran
│   ├── chat/                  Riwayat, pesan, dan kotak tulis
│   └── ui/                    Kerangka halaman, menu, badge, indikator memuat
├── lib/
│   ├── ai/
│   │   ├── model.ts           Rantai model Gemini lalu Groq
│   │   ├── persona.ts         Karakter dan aturan Asisten Pemkot
│   │   ├── system-prompt.ts   Instruksi sesuai peran
│   │   ├── registry.ts        Daftar tool per peran
│   │   └── tools/             Satu file untuk tiap kemampuan AI
│   ├── auth/
│   │   ├── middleware.ts      Penyegaran sesi dan penjaga halaman
│   │   ├── roles.ts           Daftar peran dan menu
│   │   └── session.ts         Pembacaan pengguna dan peran
│   ├── db/
│   │   ├── admin.ts           Klien server dengan kunci rahasia
│   │   ├── env.ts             Pembacaan pengaturan publik Supabase
│   │   └── server.ts          Klien atas nama pengguna (RLS aktif)
│   ├── services/              Logika vendor, proyek, ketersediaan, dan rekomendasi
│   ├── pagination.ts          Pembagian baris tabel per halaman
│   ├── format.ts              Format rupiah dan tanggal
│   ├── vendor-schema.ts       Validasi data vendor
│   └── fonts.ts               Konfigurasi font
├── data/
│   ├── 01_schema.sql          Tabel, indeks, fungsi inti
│   ├── 02_storage.sql         Bucket privat
│   ├── 03_roles_rls.sql       Fungsi peran dan aturan akses
│   ├── 04_seed.sql            Data contoh fiktif
│   └── 99_reset.sql           Menghapus semua tabel (berbahaya)
├── middleware.ts              Dijalankan pada setiap permintaan
├── .env.local.example         Daftar nama variabel
├── docs/                      Dokumentasi proyek
│   └── pemkot-AI.md           Rencana lengkap
└── README.md                  Dokumen ini
```

Folder berikut baru dibuat saat fasenya dikerjakan: `app/persetujuan/`, `app/berkas/`, dan `lib/documents/`.

## 9. Cara menjalankan

**Kebutuhan:** Node.js versi terbaru LTS, npm, akun Supabase, kunci Gemini. Kunci Groq opsional tetapi disarankan.

### Langkah 1: pasang paket

```bash
npm install
```

Peringatan `2 vulnerabilities` saat ini berasal dari `postcss` bawaan Next.js. **Jangan jalankan `npm audit fix --force`**, karena perintah itu menaikkan proyek ke Next.js 16.

### Langkah 2: isi kunci

Salin `.env.local.example` menjadi `.env.local`, lalu isi nilainya. Penjelasan ada di [bagian 10](#10-variabel-lingkungan).

### Langkah 3: siapkan database

Di **Supabase SQL Editor** proyek `pemkot-ai`, jalankan berurutan:

1. `data/01_schema.sql`
2. `data/02_storage.sql`
3. `data/03_roles_rls.sql`

Lanjutkan ke langkah 4, lalu jalankan `data/04_seed.sql` (data contoh fiktif). Urutan ini membuat akun PIC dan Vendor otomatis terhubung ke data contoh.

### Langkah 4: buat akun demo

Buat 4 akun di **Authentication > Users > Add user**, isi kata sandi pilihan sendiri, dan centang **Auto Confirm User**:

- `admin.pengadaan@contoh.test`
- `pic.proyek@contoh.test`
- `kepala.dinas@contoh.test`
- `vendor.demo@contoh.test`

Lalu beri peran lewat SQL Editor:

```sql
insert into profiles (id, nama, role)
select u.id, x.nama, x.role
from auth.users u
join (values
  ('admin.pengadaan@contoh.test', 'Admin Pengadaan Demo', 'admin_pengadaan'),
  ('pic.proyek@contoh.test',      'PIC Proyek Demo',      'pic_proyek'),
  ('kepala.dinas@contoh.test',    'Kepala Dinas Demo',    'kepala_dinas'),
  ('vendor.demo@contoh.test',     'Vendor Demo',          'vendor')
) as x(email, nama, role) on x.email = u.email
on conflict (id) do update set nama = excluded.nama, role = excluded.role;
```

### Langkah 5: jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`, lalu masuk dengan salah satu akun demo.

### Daftar perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan aplikasi untuk pengembangan |
| `npm run build` | Membuat versi produksi. Hentikan `npm run dev` lebih dulu |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Memeriksa kualitas kode |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript |

## 10. Variabel lingkungan

| Variabel | Wajib | Fungsi | Sumber |
|---|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Ya, untuk AI | Kunci Gemini | Google AI Studio |
| `GEMINI_MODELS` | Tidak | Urutan model Gemini, dipisah koma. Kosong berarti bawaan | Diisi bila perlu |
| `GROQ_API_KEY` | Tidak | Kunci Groq untuk cadangan | Groq Console |
| `GROQ_MODELS` | Tidak | Urutan model Groq, dipisah koma. Kosong berarti bawaan | Diisi bila perlu |
| `SUPABASE_URL` | Ya | URL proyek untuk server | Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL yang sama, untuk sesi login | Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Kunci publik untuk sesi login | Supabase |
| `SUPABASE_SECRET_KEY` | Ya | Kunci server. **Jangan pernah dibagikan** | Supabase |
| `APP_ENV` | Tidak | `demo` atau `local` | Diisi manual |

Setelah mengubah `.env.local`, hentikan lalu jalankan ulang `npm run dev`.

## 11. Halaman dan API

### Halaman yang sudah ada

| Alamat | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Beranda |
| `/login` | Publik | Login. Pengguna yang sudah masuk diarahkan ke dashboard |
| `/dashboard` | Wajib login | Informasi akun dan peran |
| `/chat` | Wajib login | Asisten AI dengan kemampuan sesuai peran |
| `/vendor` | Wajib login | Daftar vendor. Akun vendor diarahkan ke datanya sendiri |
| `/vendor/[id]` | Wajib login | Detail vendor. Akun vendor hanya bisa membuka miliknya |
| `/proyek` | Wajib login | Daftar proyek sesuai peran |
| `/proyek/[id]` | Wajib login | Kebutuhan dan vendor yang ditugaskan pada proyek |
| `/proyek/[id]/rekomendasi` | Admin, PIC dinasnya, Kepala Dinas | Peringkat vendor ready, rincian skor, dan alasan vendor gugur |
| `/penugasan` | Wajib login | Daftar penugasan sesuai peran |

### API internal

Semua alamat `/api/*` dijaga middleware: permintaan tanpa login mendapat `401 {"error":"unauthorized"}`.

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/api/chat` | POST | Mengirim pesan ke Asisten AI dan menerima jawaban bertahap. Maksimal 2.000 karakter per pesan dan 20 pesan per menit |
| `/api/sessions` | GET | Daftar riwayat percakapan milik pengguna |
| `/api/sessions/[id]` | GET, PUT, DELETE | Membuka, menyimpan, dan menghapus satu percakapan |
| `/api/vendor/daftar` | POST | Menyimpan pendaftaran sebagai draft (Admin dan Vendor) |

Login dan logout memakai Next.js Server Actions di `app/login/actions.ts`:

| Action | Input | Hasil |
|---|---|---|
| `signIn` | `email`, `password`, `next` (opsional) | Masuk, lalu diarahkan ke halaman tujuan di situs ini |
| `signOut` | Tidak ada | Keluar, lalu diarahkan ke `/login` |

### API yang direncanakan

| Endpoint | Fase | Fungsi |
|---|---|---|
| `/api/persetujuan` | 4 | Menyetujui atau menolak usulan |
| `/api/vendor/dokumen` | 4 atau setelahnya | Mengunggah dan memeriksa dokumen vendor |
| `/api/berkas/[id]` | 5 | Membuat tautan unduh sementara |

### Tool AI

| Tool | Fungsi | Jenis | Status |
|---|---|---|---|
| `cari_vendor` | Mencari vendor | Baca | Tersedia |
| `cek_vendor` | Melihat profil vendor | Baca | Tersedia |
| `daftar_vendor` | Membuka form pendaftaran vendor | Usulan | Tersedia |
| `daftar_proyek` | Melihat daftar proyek | Baca | Tersedia |
| `detail_proyek` | Melihat kebutuhan proyek | Baca | Tersedia |
| `cek_ketersediaan_vendor` | Mengecek vendor pada suatu periode | Baca | Tersedia |
| `rekomendasikan_vendor` | Mengambil peringkat dari database | Baca | Tersedia |
| `ringkas_data` | Meringkas data | Baca | Rencana |
| `ajukan_penugasan` | Membuat usulan penugasan | Usulan | Rencana |
| `buat_excel` | Membuat file Excel | Menulis file | Rencana |
| `buat_powerpoint` | Membuat file PowerPoint | Menulis file | Rencana |

### Layanan luar

| Layanan | Dipakai untuk |
|---|---|
| Google Gemini API | Model AI utama |
| Groq API | Model AI cadangan |
| Supabase Auth | Login dan sesi |
| Supabase Postgres | Data dan fungsi database |
| Supabase Storage | Dokumen vendor dan berkas buatan AI |

## 12. Database

### 16 tabel

| Kelompok | Tabel |
|---|---|
| Referensi dan pengguna | `opd`, `profiles`, `service_categories` |
| Vendor | `vendors`, `vendor_services`, `vendor_certifications`, `vendor_unavailability`, `vendor_documents`, `vendor_ratings` |
| Proyek | `projects`, `project_requirements`, `project_assignments` |
| Sistem | `approvals`, `generated_files`, `audit_logs`, `chat_sessions` |

### Fungsi inti

Fungsi ini hanya bisa dipanggil dari server dengan kunci rahasia.

| Fungsi | Kegunaan | Hasil |
|---|---|---|
| `cari_vendor(...)` | Mencari vendor, tahan salah ketik | Daftar vendor dan ringkasannya |
| `detail_vendor(vendor_id)` | Membaca profil lengkap dan peringatan | Satu objek JSON |
| `simpan_draft_vendor(actor, vendor_id, data)` | Menyimpan pendaftaran dalam satu transaksi | ID vendor berstatus draft |
| `daftar_proyek(actor, ...)` | Daftar proyek, dibatasi sesuai peran | Daftar proyek dan ringkasan kebutuhan |
| `detail_proyek(actor, project_id)` | Detail proyek, dibatasi sesuai peran | Satu objek JSON, atau kosong jika tidak berhak |
| `daftar_penugasan(actor, ...)` | Daftar penugasan, dibatasi sesuai peran | Daftar penugasan |
| `hitung_vendor_proyek(project_id)` | Mesin syarat wajib, alasan gugur, dan skor | Semua vendor relevan beserta hasilnya |
| `cari_vendor_ready(project_id)` | Mengambil vendor yang lolos | Daftar vendor berurutan dengan rincian skor |
| `rekomendasi_vendor_proyek(actor, project_id)` | Hasil rekomendasi sesuai peran | Satu objek JSON, atau kosong jika tidak berhak |
| `cek_ketersediaan_vendor(actor, vendor_id, mulai, selesai, tenaga)` | Mengecek satu vendor pada satu periode | Bisa atau tidak, sisa kapasitas, dan alasan |
| `apply_approval(approval_id, decider, setuju, catatan)` | Menerapkan keputusan dalam satu transaksi | `disetujui`, `ditolak`, atau `sudah_diputuskan` |

`apply_approval` membatalkan seluruh perubahan dengan error `bukan_pemutus`, `kapasitas_tidak_cukup`, `penugasan_tidak_valid`, atau `vendor_tidak_valid` bila syaratnya tidak terpenuhi.

### Bucket penyimpanan

| Bucket | Isi | Batas | Format |
|---|---|---|---|
| `vendor-documents` | Dokumen vendor | 10 MB | PDF, PNG, JPEG |
| `generated-files` | Berkas buatan AI | 20 MB | XLSX, PPTX |

Keduanya privat. File hanya diakses lewat server dan tautan sementara.

### Mengulang database dari awal

> **Peringatan:** `data/99_reset.sql` menghapus permanen semua tabel, data, dan fungsi Pemkot-AI. Akun Auth dan bucket tidak ikut terhapus. Jalankan hanya pada proyek `pemkot-ai`.

Setelah reset, jalankan lagi file `01` sampai `03`, lalu ulangi SQL pemberian peran.

## 13. Lapisan AI

Urutan pemilihan model di `lib/ai/model.ts`:

```text
Gemini 1 -> Gemini 2 -> Gemini 3 -> Gemini 4 -> Groq 1 -> Groq 2 -> pesan "sedang tidak tersedia"
```

| Kondisi | Tindakan |
|---|---|
| Kuota habis (429) | Pindah ke model berikutnya, model dilewati 10 menit |
| Model tidak ada (404) | Pindah ke model berikutnya, model dilewati 10 menit |
| Error server (5xx) | Pindah ke model berikutnya, model dilewati 10 menit |
| Permintaan salah (400) | Berhenti, tidak pindah penyedia |
| Kunci salah (401, 403) | Berhenti, tidak pindah penyedia |

Model bawaan:

- Gemini: `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`.
- Groq: `openai/gpt-oss-120b`, `openai/gpt-oss-20b` (diperiksa ke dokumentasi Groq pada 23 Nov 2026).

Pembacaan dokumen dengan gambar hanya memakai Gemini. Jika gagal, hasilnya harus ditandai "perlu diperiksa manual".

## 14. Keamanan

- **Rahasia:** kunci API dan kata sandi tidak disimpan di repository. `SUPABASE_SECRET_KEY` hanya dipakai di server.
- **Berlapis:** menu per peran, pemeriksaan di server, dan Row Level Security (RLS) di database.
- **Peran:** dibaca dari tabel `profiles` di server. Pengguna tidak bisa mengubah perannya sendiri.
- **Perubahan data:** AI hanya membuat usulan. Perubahan terjadi lewat `apply_approval()` setelah Kepala Dinas setuju.
- **Fungsi sensitif:** hak eksekusi dicabut dari `public`, `anon`, dan `authenticated`.
- **File:** bucket privat dan tautan unduh sementara.
- **Dokumen unggahan:** isinya diperlakukan sebagai data, bukan perintah untuk AI.

## 15. Desain

Tampilan formal, tenang, padat data, dan bertema terang. Tanpa maskot, emoji, atau animasi berlebihan.

| Token | Warna | Dipakai untuk |
|---|---|---|
| `navy` | `#0B2545` | Header, sidebar, judul |
| `primary` | `#1B4F8C` | Tombol utama, tautan, menu aktif |
| `primary-soft` | `#EEF3F9` | Panel lembut |
| `bg` | `#F6F8FA` | Latar halaman |
| `surface` | `#FFFFFF` | Kartu, tabel, form |
| `line` | `#D8DEE6` | Garis |
| `text` | `#1B2430` | Teks utama |
| `muted` | `#5B6675` | Teks keterangan |
| `gold` | `#E8B94A` | Penanda kecil, bukan warna teks |
| `ok` | `#1E7B4F` | Aktif, disetujui |
| `warn` | `#8A5A00` | Menunggu, hampir habis |
| `bad` | `#B42318` | Ditolak, kedaluwarsa |

Aturan penting: status selalu ikon dan kata, kontras teks minimal 4,5:1, area sentuh minimal 44 px, teks minimal 13 px, dan format Indonesia seperti `Rp 1.250.000.000` serta `23 Nov 2026`. Detail ada di bagian 12A `docs/pemkot-AI.md`.

## 16. Pemeriksaan dan pengujian

Proyek ini belum memakai suite uji otomatis. Pengujian dilakukan per skenario (bagian 17 `docs/pemkot-AI.md`).

Setelah setiap perubahan:

```bash
npx tsc --noEmit
npm run lint
```

Uji Fase 0 di browser:

1. Buka `/dashboard` tanpa login. Harus diarahkan ke `/login`.
2. Masuk dengan kata sandi salah. Harus muncul pesan error.
3. Masuk dengan keempat akun. Nama dan peran harus sesuai.
4. Akun vendor hanya melihat menu Dashboard, Chat, Data Vendor Saya, dan Penugasan Saya.
5. Tekan Keluar. Harus kembali ke `/login`.
6. Periksa tampilan pada lebar desktop dan 390 px.

## 17. Deploy ke Vercel

1. Unggah kode ke repository GitHub baru.
2. Hubungkan repository ke Vercel.
3. Isi semua variabel lingkungan di pengaturan proyek Vercel.
4. Deploy, lalu uji di alamat Vercel, bukan hanya di lokal.

File yang dibaca saat aplikasi berjalan harus ikut di-commit dan didaftarkan di `outputFileTracingIncludes` pada `next.config.ts`. File yang tidak ikut di-commit tidak akan sampai ke Vercel.

## 18. Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| "Layanan login belum dikonfigurasi" | URL atau kunci publik Supabase kosong | Isi `.env.local`, lalu jalankan ulang server |
| "Email atau kata sandi tidak sesuai" | Data login salah atau akun belum dikonfirmasi | Periksa akun di Supabase, pastikan Auto Confirm aktif |
| "Akun belum memiliki peran" | Baris `profiles` belum ada, atau SQL `03` belum dijalankan | Jalankan `03`, lalu SQL pemberian peran |
| "Belum terhubung" pada PIC atau Vendor | Data contoh belum ada | Normal sampai Fase 1 |
| Perubahan `.env.local` tidak terbaca | Server belum dimulai ulang | Hentikan dan jalankan ulang `npm run dev` |
| Peringatan `npm audit` | `postcss` bawaan Next.js | Jangan pakai `--force`. Lihat [langkah 1](#langkah-1-pasang-paket) |

## 19. Catatan teknis terbuka

- Unggah dan pemeriksaan dokumen vendor belum ada, jadi pendaftaran berhenti di status draft.
- Riwayat chat yang dikirim ke model hanya berisi teks. Hasil tool lama tidak dikirim ulang agar tidak bisa dipalsukan dari browser.
- Model Groq bawaan tidak mendukung pemanggilan tool paralel, sehingga setiap tool harus aman dipanggil satu per satu.
- Bobot skor dan syarat wajib masih menunggu keputusan atasan (bagian 19 `docs/pemkot-AI.md`).

## 20. Glosarium

| Istilah | Arti sederhana |
|---|---|
| **Vendor** | Perusahaan penyedia barang atau jasa |
| **OPD** | Organisasi Perangkat Daerah, misalnya dinas atau badan |
| **PIC** | Penanggung jawab |
| **Penugasan** | Penunjukan vendor untuk sebuah proyek pada periode tertentu |
| **Ready** | Vendor yang lolos semua syarat wajib |
| **API** | Pintu komunikasi antarprogram |
| **Server Action** | Fungsi server yang dipanggil langsung dari form |
| **Middleware** | Penjaga yang memeriksa setiap permintaan sebelum masuk ke halaman |
| **Supabase** | Layanan database, login, dan penyimpanan file |
| **RLS** | Aturan database tentang baris data yang boleh dilihat atau diubah setiap pengguna |
| **Tool** | Fungsi yang boleh dipanggil AI, misalnya mencari vendor |
| **Fallback** | Layanan cadangan saat layanan utama gagal |
| **Signed URL** | Tautan unduh sementara |
| **Audit log** | Catatan siapa melakukan apa dan kapan |
| **Seed** | Data contoh awal di database |
