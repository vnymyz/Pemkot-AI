-- Fictional demo data: agencies, categories, vendors, catalog, certificates,
-- unavailable periods, projects, assignments, ratings, and sample approvals.
-- Run after 03_roles_rls.sql and after the four demo accounts exist.
-- Safe to run again: existing rows are kept. Dates are relative to today.
-- Names, tax numbers, addresses, and contacts are invented and not valid.

insert into opd (id, kode, nama) values
  (1, 'DISDIK', 'Dinas Pendidikan'),
  (2, 'DINKES', 'Dinas Kesehatan'),
  (3, 'DPUPR', 'Dinas PUPR'),
  (4, 'DISKOMINFO', 'Dinas Kominfo'),
  (5, 'SETDA', 'Sekretariat Daerah'),
  (6, 'DLH', 'Dinas Kebersihan')
on conflict (id) do nothing;
select setval(pg_get_serial_sequence('opd', 'id'), (select max(id) from opd));

insert into service_categories (id, nama, tipe) values
  (1, 'Konstruksi bangunan', 'jasa'),
  (2, 'Jasa kebersihan', 'jasa'),
  (3, 'Pengadaan alat kesehatan', 'barang'),
  (4, 'TI dan perangkat', 'barang'),
  (5, 'Furnitur', 'barang'),
  (6, 'Kendaraan', 'barang'),
  (7, 'Konsultan', 'jasa'),
  (8, 'Jasa keamanan', 'jasa')
on conflict (id) do nothing;
select setval(pg_get_serial_sequence('service_categories', 'id'), (select max(id) from service_categories));

drop table if exists pg_temp.seed_vendor;
drop table if exists pg_temp.seed_catalog;

create temp table seed_vendor (
  n int primary key, nama text, wilayah text, tipe text, status text,
  kapasitas int, tenaga int, kategori int[]
);
insert into seed_vendor values
  ( 1, 'PT Karya Bangun',           'Kota Demo',      'jasa',        'aktif',        4, 60, '{1}'),
  ( 2, 'CV Teknik Mandiri',         'Kota Demo',      'jasa',        'aktif',        3, 40, '{1}'),
  ( 3, 'PT Bangun Sejahtera',       'Kabupaten Demo', 'jasa',        'aktif',        2, 35, '{1}'),
  ( 4, 'CV Maju Konstruksi',        'Kota Demo',      'jasa',        'aktif',        1, 25, '{1}'),
  ( 5, 'PT Griya Utama',            'Kota Demo',      'jasa',        'aktif',        2, 30, '{1}'),
  ( 6, 'CV Anugerah',               'Kabupaten Demo', 'jasa',        'aktif',        2, 25, '{1}'),
  ( 7, 'PT Bersih Nusantara Demo',  'Kota Demo',      'jasa',        'aktif',        3, 80, '{2}'),
  ( 8, 'CV Kilau Bersih',           'Kota Demo',      'jasa',        'aktif',        2, 30, '{2}'),
  ( 9, 'PT Higiene Prima Demo',     'Provinsi Demo',  'jasa',        'aktif',        4, 90, '{2}'),
  (10, 'PT Medika Sarana Demo',     'Provinsi Demo',  'barang',      'aktif',        5, 20, '{3}'),
  (11, 'CV Alkes Mandiri Demo',     'Kota Demo',      'barang',      'aktif',        3, 12, '{3}'),
  (12, 'PT Sehat Utama Demo',       'Kabupaten Demo', 'barang',      'verifikasi',   2, 10, '{3}'),
  (13, 'PT Data Teknologi Demo',    'Kota Demo',      'barang_jasa', 'aktif',        4, 25, '{4,7}'),
  (14, 'CV Maju Jaya',              'Kota Demo',      'barang',      'aktif',        3, 15, '{4}'),
  (15, 'PT Solusi Digital Demo',    'Provinsi Demo',  'barang_jasa', 'aktif',        5, 35, '{4,7}'),
  (16, 'CV Meubel Karya Demo',      'Kabupaten Demo', 'barang',      'aktif',        3, 18, '{5}'),
  (17, 'PT Interior Nusantara Demo','Kota Demo',      'barang',      'aktif',        3, 22, '{5}'),
  (18, 'PT Armada Kota Demo',       'Kota Demo',      'barang',      'aktif',        4, 16, '{6}'),
  (19, 'CV Roda Utama Demo',        'Kabupaten Demo', 'barang',      'verifikasi',   2,  8, '{6}'),
  (20, 'PT Konsultan Tata Demo',    'Kota Demo',      'jasa',        'aktif',        4, 20, '{7}'),
  (21, 'CV Cipta Konsultindo Demo', 'Kabupaten Demo', 'jasa',        'ditolak',      2,  6, '{7}'),
  (22, 'PT Garda Aman Demo',        'Kota Demo',      'jasa',        'aktif',        4, 70, '{8}'),
  (23, 'CV Satria Jaga Demo',       'Kabupaten Demo', 'jasa',        'daftar_hitam', 2, 25, '{8}'),
  (24, 'CV Mitra Demo Sejahtera',   'Kota Demo',      'barang_jasa', 'draft',        2, 10, '{2,5}'),
  (25, 'PT Cahaya Usaha Demo',      'Kota Demo',      'jasa',        'verifikasi',   2, 20, '{1}');

create temp table seed_catalog (
  category_id int, item int, nama text, deskripsi text,
  harga_min numeric, harga_maks numeric, satuan text
);
insert into seed_catalog values
  (1, 1, 'Renovasi gedung perkantoran', 'Perbaikan struktur, atap, lantai, dan finishing gedung', 450000000, 1500000000, 'paket'),
  (1, 2, 'Pembangunan gedung sederhana', 'Pekerjaan sipil dan arsitektur gedung satu sampai dua lantai', 800000000, 2500000000, 'paket'),
  (1, 3, 'Perbaikan jalan lingkungan', 'Pengaspalan dan perbaikan drainase jalan lingkungan', 150000000, 700000000, 'paket'),
  (2, 1, 'Kebersihan gedung harian', 'Layanan kebersihan ruang kantor dan area umum', 12000000, 45000000, 'bulan'),
  (2, 2, 'Pembersihan kaca gedung', 'Pembersihan kaca dan fasad gedung bertingkat', 5000000, 25000000, 'paket'),
  (2, 3, 'Pengelolaan taman kantor', 'Perawatan taman dan area hijau kantor', 4000000, 15000000, 'bulan'),
  (3, 1, 'Tensimeter digital', 'Alat ukur tekanan darah untuk puskesmas', 450000, 1200000, 'unit'),
  (3, 2, 'Tempat tidur pasien', 'Tempat tidur pasien manual dengan pengaman samping', 5500000, 14000000, 'unit'),
  (3, 3, 'Oksimeter meja', 'Alat ukur saturasi oksigen untuk ruang perawatan', 3500000, 9500000, 'unit'),
  (4, 1, 'Printer laser A4', 'Printer laser monokrom untuk kebutuhan kantor', 2500000, 6500000, 'unit'),
  (4, 2, 'Laptop kantor', 'Laptop 14 inci untuk pekerjaan administrasi', 8000000, 16000000, 'unit'),
  (4, 3, 'Perangkat jaringan kantor', 'Router, switch, dan titik akses nirkabel', 1500000, 12000000, 'unit'),
  (5, 1, 'Meja kerja staf', 'Meja kerja kayu olahan dengan laci', 1200000, 3500000, 'unit'),
  (5, 2, 'Kursi kantor ergonomis', 'Kursi kerja dengan sandaran dan pengatur tinggi', 900000, 2800000, 'unit'),
  (5, 3, 'Lemari arsip besi', 'Lemari arsip empat laci', 1800000, 4200000, 'unit'),
  (6, 1, 'Mobil operasional', 'Kendaraan penumpang untuk operasional dinas', 220000000, 380000000, 'unit'),
  (6, 2, 'Sepeda motor dinas', 'Sepeda motor untuk petugas lapangan', 18000000, 32000000, 'unit'),
  (6, 3, 'Truk pengangkut sampah', 'Truk bak untuk pengangkutan sampah kota', 350000000, 650000000, 'unit'),
  (7, 1, 'Konsultan perencanaan', 'Penyusunan dokumen perencanaan teknis', 50000000, 300000000, 'paket'),
  (7, 2, 'Konsultan pengawasan', 'Pengawasan mutu dan jadwal pekerjaan', 40000000, 250000000, 'paket'),
  (7, 3, 'Konsultan sistem informasi', 'Analisis kebutuhan dan rancangan sistem informasi', 75000000, 400000000, 'paket'),
  (8, 1, 'Petugas keamanan gedung', 'Penjagaan gedung dengan sistem shift', 15000000, 60000000, 'bulan'),
  (8, 2, 'Pengamanan acara', 'Pengamanan kegiatan resmi pemerintah', 5000000, 30000000, 'paket'),
  (8, 3, 'Patroli area kantor', 'Patroli berkala kawasan perkantoran', 8000000, 28000000, 'bulan');

-- 25 vendors
insert into vendors (id, nama, npwp, alamat, wilayah, kontak, tipe, status, kapasitas_proyek, total_tenaga)
select ('50000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, nama,
       '00.000.' || lpad(n::text, 3, '0') || '.0-000.000',
       'Jl. Contoh No. ' || n || ', ' || wilayah, wilayah,
       'vendor' || n || '@contoh.test', tipe, status, kapasitas, tenaga
  from seed_vendor
on conflict (id) do nothing;

-- 60 catalog items: vendors 1 to 10 offer three items, the others offer two.
insert into vendor_services (id, vendor_id, category_id, nama_layanan, tipe, deskripsi, harga_min, harga_maks, satuan)
select ('51000000-0000-4000-8000-' || lpad((v.n * 10 + s)::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(v.n::text, 12, '0'))::uuid,
       c.category_id, c.nama, k.tipe, c.deskripsi,
       round(c.harga_min * (90 + (v.n % 5) * 5) / 100, -3),
       round(c.harga_maks * (90 + (v.n % 5) * 5) / 100, -3),
       c.satuan
  from seed_vendor v
 cross join lateral generate_series(1, case when v.n <= 10 then 3 else 2 end) as s
  join seed_catalog c
    on c.category_id = v.kategori[((s - 1) % array_length(v.kategori, 1)) + 1]
   and c.item = ((v.n + s - 2) % 3) + 1
  join service_categories k on k.id = c.category_id
on conflict (id) do nothing;

-- 40 certificates: some are close to expiry or already expired on purpose.
insert into vendor_certifications (id, vendor_id, jenis, nomor, berlaku_sampai)
select ('52000000-0000-4000-8000-' || lpad(row_number() over (order by x.n, x.jenis)::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid,
       x.jenis, 'DEMO-' || x.jenis || '-' || lpad(x.n::text, 3, '0'),
       current_date + x.hari
  from (values
    (1,'SBU',540),(1,'K3',420),(2,'SBU',500),(2,'K3',400),(3,'SBU',480),(3,'K3',390),
    (4,'SBU',460),(4,'K3',380),(5,'SBU',450),(5,'K3',-30),(6,'SBU',440),(6,'K3',370),
    (25,'SBU',300),
    (7,'NIB',700),(8,'NIB',30),(9,'NIB',680),(10,'NIB',660),(11,'NIB',640),(12,'NIB',620),
    (13,'NIB',600),(14,'NIB',580),(15,'NIB',560),(16,'NIB',45),(17,'NIB',-15),(18,'NIB',520),
    (19,'NIB',-60),(20,'NIB',500),(21,'NIB',480),(22,'NIB',460),(23,'NIB',440),(24,'NIB',420),
    (7,'ISO',365),(9,'ISO',350),(10,'ISO',340),(11,'ISO',330),(13,'ISO',320),(15,'ISO',310),
    (18,'ISO',300),(20,'ISO',290),(22,'ISO',20)
  ) as x(n, jenis, hari)
on conflict (id) do nothing;

-- 6 unavailable periods
insert into vendor_unavailability (id, vendor_id, mulai, selesai, alasan)
select ('53000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid,
       current_date + x.dari, current_date + x.sampai, x.alasan
  from (values
    (6, 30, 140, 'Fokus pada pekerjaan lain'),
    (8, 10, 20, 'Pelatihan tenaga kerja'),
    (11, 15, 30, 'Audit internal'),
    (14, 60, 75, 'Perpindahan kantor'),
    (18, 5, 12, 'Perawatan armada'),
    (22, 90, 100, 'Rotasi personel')
  ) as x(n, dari, sampai, alasan)
on conflict (id) do nothing;

-- Link the demo accounts: the PIC to Dinas PUPR, the vendor account to its draft vendor.
update profiles p set opd_id = 3
  from auth.users u
 where u.id = p.id and u.email = 'pic.proyek@contoh.test' and p.opd_id is null;
update profiles p set vendor_id = '50000000-0000-4000-8000-000000000024'
  from auth.users u
 where u.id = p.id and u.email = 'vendor.demo@contoh.test' and p.vendor_id is null;

-- 15 projects, one requirement each. Project 1 is the featured demo project:
-- vendors 1, 2, and 3 are ready. Vendor 4 is full, 5 has an expired K3, 6 is unavailable.
drop table if exists pg_temp.seed_project;
create temp table seed_project (
  n int primary key, judul text, deskripsi text, opd int, status text, dari int, sampai int,
  anggaran numeric, wilayah text, prioritas text, kategori int, tenaga int, sertifikat text[]
);
insert into seed_project values
  ( 1, 'Renovasi Gedung Dinas', 'Renovasi struktur, atap, dan interior gedung dinas', 3, 'mencari_vendor', 40, 130, 1250000000, 'Kota Demo', 'tinggi', 1, 15, '{SBU,K3}'),
  ( 2, 'Pembangunan Ruang Kelas Baru', 'Pembangunan enam ruang kelas sekolah dasar', 1, 'berjalan', -30, 150, 1800000000, 'Kota Demo', 'tinggi', 1, 20, '{SBU,K3}'),
  ( 3, 'Perbaikan Drainase Kawasan Kantor', 'Perbaikan saluran air di kawasan perkantoran', 3, 'berjalan', -10, 100, 600000000, 'Kota Demo', 'sedang', 1, 10, '{SBU}'),
  ( 4, 'Rehabilitasi Puskesmas Pembantu', 'Perbaikan bangunan puskesmas pembantu', 2, 'berjalan', -20, 120, 900000000, 'Kota Demo', 'tinggi', 1, 15, '{SBU,K3}'),
  ( 5, 'Perluasan Gedung Arsip', 'Penambahan ruang penyimpanan arsip daerah', 5, 'berjalan', 20, 110, 750000000, 'Kabupaten Demo', 'sedang', 1, 12, '{SBU}'),
  ( 6, 'Kebersihan Gedung Balai Kota', 'Layanan kebersihan harian gedung balai kota', 6, 'berjalan', -60, 300, 300000000, 'Kota Demo', 'sedang', 2, 20, '{NIB}'),
  ( 7, 'Pengadaan Alat Kesehatan Puskesmas', 'Pengadaan tensimeter dan oksimeter', 2, 'mencari_vendor', 20, 60, 450000000, 'Kota Demo', 'tinggi', 3, 2, '{NIB}'),
  ( 8, 'Pengadaan Laptop Sekolah', 'Pengadaan laptop untuk administrasi sekolah', 1, 'mencari_vendor', 25, 55, 800000000, 'Kota Demo', 'sedang', 4, 3, '{NIB}'),
  ( 9, 'Peningkatan Jaringan Internet Kantor', 'Pemasangan perangkat jaringan kantor dinas', 4, 'rencana', 60, 150, 350000000, 'Kota Demo', 'sedang', 4, 5, '{NIB}'),
  (10, 'Pengamanan Gedung Pemerintahan', 'Layanan petugas keamanan gedung pemerintahan', 5, 'mencari_vendor', 15, 200, 240000000, 'Kota Demo', 'rendah', 8, 12, '{NIB}'),
  (11, 'Pengadaan Furnitur Ruang Rapat', 'Meja dan kursi ruang rapat', 5, 'selesai', -200, -120, 180000000, 'Kota Demo', 'rendah', 5, 4, '{NIB}'),
  (12, 'Renovasi Aula Kecamatan', 'Renovasi aula pertemuan kecamatan', 3, 'selesai', -320, -200, 950000000, 'Kota Demo', 'sedang', 1, 15, '{SBU}'),
  (13, 'Perbaikan Atap Sekolah', 'Perbaikan atap bangunan sekolah', 1, 'selesai', -180, -90, 500000000, 'Kabupaten Demo', 'tinggi', 1, 10, '{SBU}'),
  (14, 'Kebersihan Taman Kota', 'Perawatan dan kebersihan taman kota', 6, 'selesai', -240, -60, 120000000, 'Kota Demo', 'rendah', 2, 10, '{NIB}'),
  (15, 'Konsultansi Sistem Informasi Dinas', 'Analisis kebutuhan sistem informasi dinas', 4, 'selesai', -150, -40, 200000000, 'Kota Demo', 'sedang', 7, 4, '{NIB}');

insert into projects (id, nomor, judul, deskripsi, opd_id, status, mulai, selesai, anggaran, wilayah, prioritas)
select ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'PRJ-DEMO-' || lpad(n::text, 3, '0'), judul, deskripsi, opd, status,
       current_date + dari, current_date + sampai, anggaran, wilayah, prioritas
  from seed_project
on conflict (id) do nothing;

insert into project_requirements (id, project_id, category_id, tenaga_min, sertifikat_wajib)
select ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       kategori, tenaga, sertifikat
  from seed_project
on conflict (id) do nothing;

-- 3 sample approvals: pending, approved, rejected.
insert into approvals (id, jenis, payload, status, diusulkan_oleh, diputuskan_oleh, catatan, created_at, decided_at)
select ('64000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid, 'project_assignment',
       jsonb_build_object('assignment_id', '62000000-0000-4000-8000-' || lpad(x.penugasan::text, 12, '0')),
       x.status,
       (select id from auth.users where email = 'admin.pengadaan@contoh.test'),
       case when x.status = 'pending' then null
            else (select id from auth.users where email = 'kepala.dinas@contoh.test') end,
       x.catatan, now() - make_interval(days => x.hari),
       case when x.status = 'pending' then null else now() - make_interval(days => x.hari - 1) end
  from (values
    (1, 7, 'pending', null::text, 2),
    (2, 4, 'approved', 'Kapasitas vendor mencukupi.', 12),
    (3, 8, 'rejected', 'Penawaran perlu ditinjau ulang.', 8)
  ) as x(n, penugasan, status, catatan, hari)
on conflict (id) do nothing;

-- 20 assignments. Only disetujui and berjalan use vendor capacity.
insert into project_assignments (id, project_id, vendor_id, status, tenaga_dialokasikan, mulai, selesai, nilai, approval_id)
select ('62000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid,
       ('60000000-0000-4000-8000-' || lpad(x.proyek::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(x.vendor::text, 12, '0'))::uuid,
       x.status, x.tenaga, current_date + p.dari, current_date + p.sampai, x.nilai,
       case when x.approval is null then null
            else ('64000000-0000-4000-8000-' || lpad(x.approval::text, 12, '0'))::uuid end
  from (values
    ( 1,  2,  1, 'berjalan',   20, 1700000000, null::int),
    ( 2,  3,  1, 'berjalan',   10,  570000000, null),
    ( 3,  4,  4, 'berjalan',   15,  850000000, null),
    ( 4,  5,  3, 'disetujui',  12,  720000000, 2),
    ( 5,  6,  7, 'berjalan',   20,  200000000, null),
    ( 6,  6,  8, 'berjalan',   10,   90000000, null),
    ( 7,  7, 10, 'diusulkan',   2,  430000000, 1),
    ( 8,  8, 14, 'dibatalkan',  3,  760000000, 3),
    ( 9, 11, 16, 'selesai',     2,   90000000, null),
    (10, 11, 17, 'selesai',     2,   85000000, null),
    (11, 12,  1, 'selesai',     8,  420000000, null),
    (12, 12,  2, 'selesai',     5,  300000000, null),
    (13, 12,  3, 'selesai',     4,  200000000, null),
    (14, 13,  1, 'selesai',     6,  300000000, null),
    (15, 13,  3, 'selesai',     4,  180000000, null),
    (16, 14,  7, 'selesai',     5,   50000000, null),
    (17, 14,  9, 'selesai',     3,   40000000, null),
    (18, 14,  8, 'selesai',     2,   25000000, null),
    (19, 15, 13, 'selesai',     2,  110000000, null),
    (20, 15, 20, 'selesai',     2,   85000000, null)
  ) as x(n, proyek, vendor, status, tenaga, nilai, approval)
  join seed_project p on p.n = x.proyek
on conflict (id) do nothing;

-- 12 ratings, one for each finished assignment.
insert into vendor_ratings (id, vendor_id, project_id, skor_kualitas, tepat_waktu, catatan)
select ('63000000-0000-4000-8000-' || lpad(row_number() over (order by x.proyek, x.vendor)::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(x.vendor::text, 12, '0'))::uuid,
       ('60000000-0000-4000-8000-' || lpad(x.proyek::text, 12, '0'))::uuid,
       x.skor, x.tepat, 'Penilaian contoh untuk demo'
  from (values
    (11, 16, 4, true), (11, 17, 5, true),
    (12, 1, 5, true), (12, 2, 3, true), (12, 3, 4, false),
    (13, 1, 4, true), (13, 3, 3, true),
    (14, 7, 5, true), (14, 8, 4, true), (14, 9, 4, false),
    (15, 13, 5, true), (15, 20, 4, true)
  ) as x(proyek, vendor, skor, tepat)
on conflict (id) do nothing;

drop table if exists pg_temp.seed_project;

drop table if exists pg_temp.seed_vendor;
drop table if exists pg_temp.seed_catalog;
