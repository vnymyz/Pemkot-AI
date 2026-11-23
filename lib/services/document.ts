import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import { bangunExcel } from "@/lib/documents/excel-builder";
import { bangunPowerPoint } from "@/lib/documents/ppt-builder";
import { bangunWord } from "@/lib/documents/word-builder";
import {
  JUMLAH_SLIDE,
  SUMBER_LABEL,
  totalBaris,
  type BerkasRow,
  type DokumenData,
  type JenisBerkas,
  type SumberDokumen,
} from "@/lib/documents/types";
import { formatRupiah, formatTanggal, tanggalHariIni } from "@/lib/format";
import { daftarPenugasan, daftarProyek } from "./project";
import { ASSIGNMENT_STATUS_LABEL, PROJECT_STATUS_LABEL } from "./project-types";
import { rekomendasiByNama } from "./recommendation";
import { detailVendor } from "./vendor";

const BUCKET = "generated-files";
const SIGNED_URL_SECONDS = 3600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const EXPIRING_DAYS = 60;

export class DocumentError extends Error {}

const INTERNAL_ROLES = ["admin_pengadaan", "pic_proyek", "kepala_dinas"];
/** Every role may create Word, Excel, and PowerPoint files, but only from sources it may see. */
const ALL_ROLES = [...INTERNAL_ROLES, "vendor"];
const SUMBER_ROLES: Record<SumberDokumen, string[]> = {
  rekomendasi_proyek: INTERNAL_ROLES,
  proyek_tanpa_vendor: INTERNAL_ROLES,
  vendor_sertifikat_hampir_habis: INTERNAL_ROLES,
  daftar_penugasan: ALL_ROLES,
  profil_vendor_saya: ["vendor"],
};
const MIME: Record<JenisBerkas, string> = { xlsx: XLSX_TYPE, pptx: PPTX_TYPE, docx: DOCX_TYPE };

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000);

/** Collects the rows for one named source. Every number comes from the database services. */
export async function ambilDataDokumen(
  session: AuthSession,
  sumber: SumberDokumen,
  proyek?: string,
): Promise<DokumenData> {
  if (!SUMBER_ROLES[sumber].includes(session.role)) throw new DocumentError("akses_ditolak");
  const dibuat = tanggalHariIni();
  const dasar = { sumber, dibuat, grafik: null, kode: null as string | null };

  if (sumber === "rekomendasi_proyek") {
    if (!proyek?.trim()) throw new DocumentError("proyek_diperlukan");
    const hasil = await rekomendasiByNama(session, proyek);
    if (!hasil) throw new DocumentError("proyek_tidak_ditemukan");
    const top = hasil.ready[0];
    return {
      ...dasar,
      kode: hasil.proyek.nomor,
      judul: `Rekomendasi vendor: ${hasil.proyek.judul}`,
      subjudul: `${hasil.proyek.nomor}, ${hasil.proyek.opd}`,
      lembar: [
        {
          nama: "Peringkat vendor ready",
          kolom: [
            { header: "Peringkat", key: "peringkat", format: "angka" },
            { header: "Vendor", key: "vendor" },
            { header: "Wilayah", key: "wilayah_vendor" },
            { header: "Skor (0 sampai 100)", key: "skor", format: "desimal" },
            { header: "Pengalaman (25)", key: "s_pengalaman", format: "desimal" },
            { header: "Kinerja (25)", key: "s_kinerja", format: "desimal" },
            { header: "Waktu (15)", key: "s_waktu", format: "desimal" },
            { header: "Kapasitas (15)", key: "s_kapasitas", format: "desimal" },
            { header: "Harga (10)", key: "s_harga", format: "desimal" },
            { header: "Wilayah (10)", key: "s_wilayah", format: "desimal" },
            { header: "Sisa proyek", key: "sisa_proyek", format: "angka" },
            { header: "Sisa tenaga", key: "sisa_tenaga", format: "angka" },
          ],
          baris: hasil.ready.map((item) => ({
            peringkat: item.peringkat,
            vendor: item.nama,
            wilayah_vendor: item.wilayah,
            skor: Number(item.skor),
            s_pengalaman: Number(item.s_pengalaman),
            s_kinerja: Number(item.s_kinerja),
            s_waktu: Number(item.s_waktu),
            s_kapasitas: Number(item.s_kapasitas),
            s_harga: Number(item.s_harga),
            s_wilayah: Number(item.s_wilayah),
            sisa_proyek: item.sisa_proyek,
            sisa_tenaga: item.sisa_tenaga,
          })),
        },
        {
          nama: "Vendor gugur",
          kolom: [
            { header: "Vendor", key: "vendor" },
            { header: "Status vendor", key: "status" },
            { header: "Alasan gugur", key: "alasan" },
          ],
          baris: hasil.gugur.map((item) => ({
            vendor: item.nama,
            status: item.status,
            alasan: item.alasan_gugur.join("; "),
          })),
        },
      ],
      ringkasan: [
        { label: "Proyek", nilai: `${hasil.proyek.judul} (${hasil.proyek.nomor})` },
        { label: "Dinas", nilai: hasil.proyek.opd },
        { label: "Periode", nilai: `${formatTanggal(hasil.proyek.mulai)} sampai ${formatTanggal(hasil.proyek.selesai)}` },
        { label: "Anggaran", nilai: formatRupiah(hasil.proyek.anggaran) },
        { label: "Vendor ready", nilai: String(hasil.jumlah_ready) },
        { label: "Vendor gugur", nilai: String(hasil.jumlah_gugur) },
      ],
      kesimpulan: top
        ? [
            `Peringkat pertama adalah ${top.nama} dengan skor ${Number(top.skor).toLocaleString("id-ID")} dari 100.`,
            `Terdapat ${hasil.jumlah_ready} vendor ready dan ${hasil.jumlah_gugur} vendor gugur.`,
            "Rekomendasi bukan keputusan. Penugasan memerlukan persetujuan Kepala Dinas.",
          ]
        : [
            "Belum ada vendor yang memenuhi semua syarat wajib.",
            ...hasil.alasan_terbanyak.map((item) => `${item.alasan} (${item.jumlah} vendor)`),
            "Pertimbangkan menggeser periode, mengurangi tenaga minimal, atau memeriksa kategori lain.",
          ],
      grafik: hasil.ready.length
        ? {
            judul: "Skor vendor ready",
            label: hasil.ready.slice(0, 5).map((item) => item.nama),
            nilai: hasil.ready.slice(0, 5).map((item) => Number(item.skor)),
            maks: 100,
          }
        : null,
    };
  }

  if (sumber === "proyek_tanpa_vendor") {
    const proyekList = await daftarProyek(session, { tanpa_vendor: true, limit: 200 });
    if (proyekList.length === 0) throw new DocumentError("tidak_ada_data");
    return {
      ...dasar,
      judul: "Proyek yang belum memiliki vendor",
      subjudul: `${proyekList.length} proyek per ${formatTanggal(dibuat)}`,
      lembar: [
        {
          nama: "Proyek tanpa vendor",
          kolom: [
            { header: "Nomor", key: "nomor" },
            { header: "Proyek", key: "judul" },
            { header: "Dinas", key: "opd" },
            { header: "Status", key: "status" },
            { header: "Mulai", key: "mulai", format: "tanggal" },
            { header: "Selesai", key: "selesai", format: "tanggal" },
            { header: "Anggaran", key: "anggaran", format: "rupiah" },
            { header: "Kebutuhan", key: "kebutuhan" },
            { header: "Tenaga minimal", key: "tenaga_min", format: "angka" },
            { header: "Sertifikat wajib", key: "sertifikat" },
            { header: "Usulan menunggu", key: "usulan", format: "angka" },
          ],
          baris: proyekList.map((item) => ({
            nomor: item.nomor,
            judul: item.judul,
            opd: item.opd,
            status: PROJECT_STATUS_LABEL[item.status] ?? item.status,
            mulai: item.mulai,
            selesai: item.selesai,
            anggaran: item.anggaran,
            kebutuhan: item.kategori.join(", "),
            tenaga_min: item.tenaga_min,
            sertifikat: item.sertifikat_wajib.join(", "),
            usulan: item.jumlah_usulan,
          })),
        },
      ],
      ringkasan: [
        { label: "Jumlah proyek", nilai: String(proyekList.length) },
        { label: "Dengan usulan menunggu", nilai: String(proyekList.filter((item) => item.jumlah_usulan > 0).length) },
        { label: "Status mencari vendor", nilai: String(proyekList.filter((item) => item.status === "mencari_vendor").length) },
      ],
      kesimpulan: [
        `Terdapat ${proyekList.length} proyek yang belum memiliki vendor berstatus disetujui atau berjalan.`,
        "Proyek dengan usulan menunggu sedang menunggu keputusan Kepala Dinas.",
      ],
    };
  }

  if (sumber === "vendor_sertifikat_hampir_habis") {
    const batas = addDays(dibuat, EXPIRING_DAYS);
    const { data, error } = await adminDb()
      .from("vendor_certifications")
      .select("jenis, nomor, berlaku_sampai, vendors!inner(nama, status)")
      .eq("vendors.status", "aktif")
      .lte("berlaku_sampai", batas)
      .order("berlaku_sampai", { ascending: true });
    if (error) throw new Error(`certificates failed: ${error.code}`);
    const rows = (data ?? []) as unknown as {
      jenis: string;
      nomor: string | null;
      berlaku_sampai: string;
      vendors: { nama: string };
    }[];
    if (rows.length === 0) throw new DocumentError("tidak_ada_data");
    const baris = rows.map((item) => {
      const sisa = daysBetween(dibuat, item.berlaku_sampai);
      return {
        vendor: item.vendors.nama,
        jenis: item.jenis,
        nomor: item.nomor,
        berlaku_sampai: item.berlaku_sampai,
        sisa_hari: sisa,
        status: sisa < 0 ? "Kedaluwarsa" : "Hampir habis",
      };
    });
    const kedaluwarsa = baris.filter((item) => item.status === "Kedaluwarsa").length;
    return {
      ...dasar,
      judul: "Sertifikat vendor hampir habis atau kedaluwarsa",
      subjudul: `Vendor aktif, batas ${EXPIRING_DAYS} hari dari ${formatTanggal(dibuat)}`,
      lembar: [
        {
          nama: "Sertifikat",
          kolom: [
            { header: "Vendor", key: "vendor" },
            { header: "Jenis", key: "jenis" },
            { header: "Nomor", key: "nomor" },
            { header: "Berlaku sampai", key: "berlaku_sampai", format: "tanggal" },
            { header: "Sisa hari", key: "sisa_hari", format: "angka" },
            { header: "Status", key: "status" },
          ],
          baris,
        },
      ],
      ringkasan: [
        { label: "Jumlah sertifikat", nilai: String(baris.length) },
        { label: "Kedaluwarsa", nilai: String(kedaluwarsa) },
        { label: "Hampir habis", nilai: String(baris.length - kedaluwarsa) },
        { label: "Jumlah vendor", nilai: String(new Set(baris.map((item) => item.vendor)).size) },
      ],
      kesimpulan: [
        `${kedaluwarsa} sertifikat sudah kedaluwarsa dan ${baris.length - kedaluwarsa} akan habis dalam ${EXPIRING_DAYS} hari.`,
        "Vendor dengan sertifikat kedaluwarsa tidak lolos syarat wajib pada proyek yang membutuhkannya.",
      ],
    };
  }

  if (sumber === "profil_vendor_saya") {
    if (!session.vendorId) throw new DocumentError("tidak_ada_data");
    const vendor = await detailVendor(session, session.vendorId);
    if (!vendor) throw new DocumentError("tidak_ada_data");
    return {
      ...dasar,
      judul: `Profil vendor: ${vendor.nama}`,
      subjudul: `Status ${vendor.status}, per ${formatTanggal(dibuat)}`,
      lembar: [
        {
          nama: "Layanan",
          kolom: [
            { header: "Kategori", key: "kategori" },
            { header: "Layanan", key: "nama_layanan" },
            { header: "Harga minimal", key: "harga_min", format: "rupiah" },
            { header: "Harga maksimal", key: "harga_maks", format: "rupiah" },
            { header: "Satuan", key: "satuan" },
          ],
          baris: vendor.layanan.map((item) => ({
            kategori: item.kategori,
            nama_layanan: item.nama_layanan,
            harga_min: item.harga_min,
            harga_maks: item.harga_maks,
            satuan: item.satuan,
          })),
        },
        {
          nama: "Sertifikat",
          kolom: [
            { header: "Jenis", key: "jenis" },
            { header: "Nomor", key: "nomor" },
            { header: "Berlaku sampai", key: "berlaku_sampai", format: "tanggal" },
            { header: "Sisa hari", key: "sisa_hari", format: "angka" },
            { header: "Status", key: "status" },
          ],
          baris: vendor.sertifikat.map((item) => ({
            jenis: item.jenis,
            nomor: item.nomor,
            berlaku_sampai: item.berlaku_sampai,
            sisa_hari: item.sisa_hari,
            status: item.status_berlaku === "berlaku" ? "Berlaku" : item.status_berlaku === "hampir_habis" ? "Hampir habis" : "Kedaluwarsa",
          })),
        },
        {
          nama: "Riwayat proyek",
          kolom: [
            { header: "Nomor", key: "nomor" },
            { header: "Proyek", key: "judul" },
            { header: "Status", key: "status" },
            { header: "Mulai", key: "mulai", format: "tanggal" },
            { header: "Selesai", key: "selesai", format: "tanggal" },
          ],
          baris: vendor.riwayat.map((item) => ({
            nomor: item.nomor,
            judul: item.judul,
            status: item.status,
            mulai: item.mulai,
            selesai: item.selesai,
          })),
        },
      ],
      ringkasan: [
        { label: "Nama vendor", nilai: vendor.nama },
        { label: "Wilayah", nilai: vendor.wilayah ?? "Tidak ada data" },
        { label: "Kapasitas proyek", nilai: String(vendor.kapasitas_proyek) },
        { label: "Proyek berjalan", nilai: String(vendor.beban.proyek_berjalan) },
        { label: "Sisa kapasitas proyek", nilai: String(vendor.beban.sisa_proyek) },
        { label: "Sisa tenaga", nilai: String(vendor.beban.sisa_tenaga) },
      ],
      kesimpulan: [
        `Vendor memiliki ${vendor.layanan.length} layanan dan ${vendor.sertifikat.length} sertifikat tercatat.`,
        ...(vendor.peringatan.length ? vendor.peringatan : ["Tidak ada peringatan pada data vendor."]),
      ],
    };
  }

  const penugasan = await daftarPenugasan(session);
  if (penugasan.length === 0) throw new DocumentError("tidak_ada_data");
  return {
    ...dasar,
    judul: "Daftar penugasan vendor",
    subjudul: `${penugasan.length} penugasan per ${formatTanggal(dibuat)}`,
    lembar: [
      {
        nama: "Penugasan",
        kolom: [
          { header: "Nomor proyek", key: "nomor" },
          { header: "Proyek", key: "judul" },
          { header: "Dinas", key: "opd" },
          { header: "Vendor", key: "vendor" },
          { header: "Status", key: "status" },
          { header: "Tenaga", key: "tenaga", format: "angka" },
          { header: "Mulai", key: "mulai", format: "tanggal" },
          { header: "Selesai", key: "selesai", format: "tanggal" },
          { header: "Nilai", key: "nilai", format: "rupiah" },
        ],
        baris: penugasan.map((item) => ({
          nomor: item.nomor,
          judul: item.judul,
          opd: item.opd,
          vendor: item.vendor,
          status: ASSIGNMENT_STATUS_LABEL[item.status] ?? item.status,
          tenaga: item.tenaga_dialokasikan,
          mulai: item.mulai,
          selesai: item.selesai,
          nilai: item.nilai,
        })),
      },
    ],
    ringkasan: [
      { label: "Jumlah penugasan", nilai: String(penugasan.length) },
      { label: "Menunggu persetujuan", nilai: String(penugasan.filter((item) => item.status === "diusulkan").length) },
      { label: "Berjalan atau disetujui", nilai: String(penugasan.filter((item) => ["disetujui", "berjalan"].includes(item.status)).length) },
      { label: "Selesai", nilai: String(penugasan.filter((item) => item.status === "selesai").length) },
    ],
    kesimpulan: [`Terdapat ${penugasan.length} penugasan pada daftar ini.`],
  };
}

/** A short, deterministic summary the assistant can phrase. Numbers are counted here, not by the model. */
export async function ringkasData(session: AuthSession, sumber: SumberDokumen, proyek?: string) {
  const data = await ambilDataDokumen(session, sumber, proyek);
  return {
    judul: data.judul,
    subjudul: data.subjudul,
    jumlah_baris: totalBaris(data),
    ringkasan: data.ringkasan,
    kesimpulan: data.kesimpulan,
    contoh_baris: data.lembar[0].baris.slice(0, 5),
  };
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function simpanBerkas(
  session: AuthSession,
  input: { data: DokumenData; jenis: JenisBerkas; buffer: Buffer; baris: number; slide: number | null },
) {
  const db = adminDb();
  const tanggal = input.data.dibuat.replaceAll("-", "");
  const nama = `${slug(SUMBER_LABEL[input.data.sumber])}${input.data.kode ? `-${input.data.kode.toLowerCase()}` : ""}-${tanggal}.${input.jenis}`;
  const path = `${session.userId}/${crypto.randomUUID()}.${input.jenis}`;

  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, input.buffer, {
    contentType: MIME[input.jenis],
    upsert: false,
  });
  if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

  const { data: saved, error } = await db
    .from("generated_files")
    .insert({
      nama,
      jenis: input.jenis,
      file_path: path,
      dibuat_oleh: session.userId,
      sumber_data: JSON.stringify({ sumber: input.data.sumber, kode: input.data.kode, baris: input.baris, slide: input.slide }),
    })
    .select("id, created_at")
    .single();
  if (error || !saved) {
    await db.storage.from(BUCKET).remove([path]);
    throw new Error(`file record failed: ${error?.code}`);
  }
  await db.from("audit_logs").insert({
    actor_id: session.userId,
    aksi: "berkas_dibuat",
    target: saved.id,
    detail: { nama, jenis: input.jenis, sumber: input.data.sumber, baris: input.baris, slide: input.slide },
  });
  return { id: saved.id as string, nama, jenis: input.jenis, baris: input.baris, slide: input.slide, dibuat: saved.created_at as string };
}

export async function buatExcel(session: AuthSession, input: { sumber: SumberDokumen; proyek?: string }) {
  const data = await ambilDataDokumen(session, input.sumber, input.proyek);
  const buffer = await bangunExcel(data);
  return simpanBerkas(session, { data, jenis: "xlsx", buffer, baris: totalBaris(data), slide: null });
}

export async function buatPowerPoint(session: AuthSession, input: { sumber: SumberDokumen; proyek?: string }) {
  const data = await ambilDataDokumen(session, input.sumber, input.proyek);
  const { buffer, slide } = await bangunPowerPoint(data);
  return simpanBerkas(session, { data, jenis: "pptx", buffer, baris: totalBaris(data), slide });
}

export async function buatWord(session: AuthSession, input: { sumber: SumberDokumen; proyek?: string }) {
  const data = await ambilDataDokumen(session, input.sumber, input.proyek);
  const buffer = await bangunWord(data);
  return simpanBerkas(session, { data, jenis: "docx", buffer, baris: totalBaris(data), slide: null });
}

type FileRecord = {
  id: string;
  nama: string;
  jenis: JenisBerkas;
  file_path: string;
  dibuat_oleh: string | null;
  sumber_data: string | null;
  created_at: string;
};

function parseSource(text: string | null) {
  try {
    const parsed = JSON.parse(text ?? "{}") as { sumber?: string; baris?: number; slide?: number | null };
    return {
      sumber: SUMBER_LABEL[parsed.sumber as SumberDokumen] ?? parsed.sumber ?? "Tidak ada data",
      baris: typeof parsed.baris === "number" ? parsed.baris : null,
      slide: typeof parsed.slide === "number" ? parsed.slide : null,
    };
  } catch {
    return { sumber: text ?? "Tidak ada data", baris: null, slide: null };
  }
}

/** Every role sees its own files. Kepala Dinas sees every file. */
export async function daftarBerkas(session: AuthSession): Promise<BerkasRow[]> {
  let query = adminDb()
    .from("generated_files")
    .select("id, nama, jenis, file_path, dibuat_oleh, sumber_data, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (session.role !== "kepala_dinas") query = query.eq("dibuat_oleh", session.userId);
  const { data, error } = await query;
  if (error) throw new Error(`files failed: ${error.code}`);
  const files = (data ?? []) as FileRecord[];

  const ownerIds = [...new Set(files.map((file) => file.dibuat_oleh).filter((id): id is string => Boolean(id)))];
  const { data: owners } = ownerIds.length
    ? await adminDb().from("profiles").select("id, nama").in("id", ownerIds)
    : { data: [] as { id: string; nama: string }[] };
  const names = new Map((owners ?? []).map((owner) => [owner.id, owner.nama]));

  return files.map((file) => ({
    id: file.id,
    nama: file.nama,
    jenis: file.jenis,
    ...parseSource(file.sumber_data),
    dibuat_oleh: names.get(file.dibuat_oleh ?? "") ?? "Tidak ada data",
    created_at: file.created_at,
  }));
}

/** A fresh one-hour link, created only after the role check. */
export async function urlBerkas(session: AuthSession, id: string) {
  if (!UUID.test(id)) throw new DocumentError("berkas_tidak_ditemukan");
  const { data, error } = await adminDb()
    .from("generated_files")
    .select("id, nama, file_path, dibuat_oleh")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`file lookup failed: ${error.code}`);
  if (!data || (session.role !== "kepala_dinas" && data.dibuat_oleh !== session.userId)) {
    throw new DocumentError("berkas_tidak_ditemukan");
  }
  const { data: signed, error: signError } = await adminDb()
    .storage.from(BUCKET)
    .createSignedUrl(data.file_path, SIGNED_URL_SECONDS, { download: data.nama });
  if (signError || !signed) throw new Error(`signed url failed: ${signError?.message}`);
  return signed.signedUrl;
}

export const SLIDE_COUNT = JUMLAH_SLIDE;
