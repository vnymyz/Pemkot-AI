import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import { periksaDokumen } from "@/lib/ai/verify-document";
import { DOKUMEN_MAX_BYTES, detectFileType, type DokumenJenis } from "@/lib/vendor-document-schema";
import type { DokumenVendorRow, StatusCek } from "./vendor-document-types";

const BUCKET = "vendor-documents";
const SIGNED_URL_SECONDS = 3600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class VendorDocError extends Error {
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(message);
  }
}

type DocRecord = {
  id: string;
  vendor_id: string;
  jenis: DokumenJenis;
  file_path: string;
  status_cek: StatusCek;
  hasil_cek_ai: Record<string, unknown> | null;
  created_at: string;
};

const asText = (value: unknown) => (typeof value === "string" ? value : null);

function toRow(doc: DocRecord): DokumenVendorRow {
  const hasil = doc.hasil_cek_ai ?? {};
  return {
    id: doc.id,
    jenis: doc.jenis,
    nama_file: asText(hasil.nama_file) ?? doc.file_path.split("/").pop() ?? doc.jenis,
    status_cek: doc.status_cek,
    catatan: asText(hasil.catatan_admin) ?? asText(hasil.catatan),
    diputuskan_manual: hasil.diputuskan_manual === true,
    created_at: doc.created_at,
  };
}

/** Admin, or the vendor that owns the record. */
function canManage(session: AuthSession, vendorId: string) {
  return session.role === "admin_pengadaan" || (session.role === "vendor" && session.vendorId === vendorId);
}

function canView(session: AuthSession, vendorId: string) {
  return session.role === "vendor" ? session.vendorId === vendorId : true;
}

export async function daftarDokumenVendor(session: AuthSession, vendorId: string): Promise<DokumenVendorRow[]> {
  if (!UUID.test(vendorId) || !canView(session, vendorId)) return [];
  const { data, error } = await adminDb()
    .from("vendor_documents")
    .select("id, vendor_id, jenis, file_path, status_cek, hasil_cek_ai, created_at")
    .eq("vendor_id", vendorId);
  if (error) throw new Error(`documents failed: ${error.code}`);
  return ((data ?? []) as DocRecord[]).map(toRow);
}

async function audit(session: AuthSession, aksi: string, target: string, detail: Record<string, unknown>) {
  const { error } = await adminDb().from("audit_logs").insert({ actor_id: session.userId, aksi, target, detail });
  if (error) console.error("[audit] failed:", error.code);
}

export async function unggahDokumen(
  session: AuthSession,
  input: { vendorId: string; jenis: DokumenJenis; file: File },
) {
  if (!UUID.test(input.vendorId) || !canManage(session, input.vendorId)) throw new VendorDocError("akses_ditolak");

  const db = adminDb();
  const { data: vendor, error: vendorError } = await db
    .from("vendors")
    .select("id, nama, npwp, status")
    .eq("id", input.vendorId)
    .maybeSingle();
  if (vendorError) throw new Error(`vendor lookup failed: ${vendorError.code}`);
  if (!vendor) throw new VendorDocError("vendor_tidak_ditemukan");
  if (vendor.status !== "draft") throw new VendorDocError("bukan_draft");

  if (input.file.size === 0 || input.file.size > DOKUMEN_MAX_BYTES) throw new VendorDocError("file_tidak_valid");
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const type = detectFileType(bytes);
  if (!type) throw new VendorDocError("file_tidak_valid");

  const { data: previous } = await db
    .from("vendor_documents")
    .select("id, file_path")
    .eq("vendor_id", input.vendorId)
    .eq("jenis", input.jenis)
    .maybeSingle();

  const path = `${input.vendorId}/${crypto.randomUUID()}.${type.ext}`;
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: type.mediaType,
    upsert: false,
  });
  if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

  const verdict = await periksaDokumen({
    bytes,
    mediaType: type.mediaType,
    jenis: input.jenis,
    vendor: { nama: vendor.nama, npwp: vendor.npwp },
  });

  const namaFile = input.file.name.replace(/[\\/]/g, "_").slice(0, 120) || `${input.jenis}.${type.ext}`;
  const { data: saved, error: saveError } = await db
    .from("vendor_documents")
    .upsert(
      {
        vendor_id: input.vendorId,
        jenis: input.jenis,
        file_path: path,
        status_cek: verdict.status,
        hasil_cek_ai: {
          nama_file: namaFile,
          catatan: verdict.catatan,
          dibaca: verdict.reading,
          diperiksa_pada: new Date().toISOString(),
        },
      },
      { onConflict: "vendor_id,jenis" },
    )
    .select("id")
    .single();
  if (saveError || !saved) {
    await db.storage.from(BUCKET).remove([path]);
    throw new Error(`document save failed: ${saveError?.code}`);
  }

  if (previous?.file_path && previous.file_path !== path) await db.storage.from(BUCKET).remove([previous.file_path]);
  await audit(session, "dokumen_vendor_diunggah", saved.id, {
    vendor_id: input.vendorId,
    jenis: input.jenis,
    status_cek: verdict.status,
  });
  return { id: saved.id as string, status_cek: verdict.status, catatan: verdict.catatan };
}

async function ambilDokumen(session: AuthSession, id: string) {
  if (!UUID.test(id)) throw new VendorDocError("dokumen_tidak_ditemukan");
  const { data, error } = await adminDb()
    .from("vendor_documents")
    .select("id, vendor_id, jenis, file_path, status_cek, hasil_cek_ai, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`document lookup failed: ${error.code}`);
  const doc = data as DocRecord | null;
  if (!doc || !canView(session, doc.vendor_id)) throw new VendorDocError("dokumen_tidak_ditemukan");
  return doc;
}

export async function urlDokumen(session: AuthSession, id: string) {
  const doc = await ambilDokumen(session, id);
  const { data, error } = await adminDb().storage.from(BUCKET).createSignedUrl(doc.file_path, SIGNED_URL_SECONDS);
  if (error || !data) throw new Error(`signed url failed: ${error?.message}`);
  return data.signedUrl;
}

export async function hapusDokumen(session: AuthSession, id: string) {
  const doc = await ambilDokumen(session, id);
  if (!canManage(session, doc.vendor_id)) throw new VendorDocError("akses_ditolak");

  const db = adminDb();
  const { data: vendor } = await db.from("vendors").select("status").eq("id", doc.vendor_id).maybeSingle();
  if (vendor?.status !== "draft") throw new VendorDocError("bukan_draft");

  const { error } = await db.from("vendor_documents").delete().eq("id", doc.id);
  if (error) throw new Error(`document delete failed: ${error.code}`);
  await db.storage.from(BUCKET).remove([doc.file_path]);
  await audit(session, "dokumen_vendor_dihapus", doc.id, { vendor_id: doc.vendor_id, jenis: doc.jenis });
}

export async function putuskanDokumen(session: AuthSession, id: string, lengkap: boolean, catatan?: string) {
  if (session.role !== "admin_pengadaan") throw new VendorDocError("akses_ditolak");
  if (!UUID.test(id)) throw new VendorDocError("dokumen_tidak_ditemukan");
  const { data, error } = await adminDb().rpc("putuskan_dokumen_vendor", {
    p_actor: session.userId,
    p_document_id: id,
    p_lengkap: lengkap,
    p_catatan: catatan?.trim() || null,
  });
  if (error) {
    if (["akses_ditolak", "dokumen_tidak_ditemukan", "bukan_draft"].includes(error.message)) {
      throw new VendorDocError(error.message);
    }
    throw new Error(`putuskan_dokumen_vendor failed: ${error.code}`);
  }
  return data as { status_cek: StatusCek };
}
