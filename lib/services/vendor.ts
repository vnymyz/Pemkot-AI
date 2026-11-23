import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import type { DraftVendor } from "@/lib/vendor-schema";
import type { FormDaftarOutput, Kategori, VendorDetail, VendorRingkas } from "./vendor-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FilterVendor = {
  kata_kunci?: string;
  kategori?: string;
  tipe?: "barang" | "jasa" | "barang_jasa";
  wilayah?: string;
  /** null means every non-archived status. */
  status?: string | null;
  limit?: number;
};

export class VendorError extends Error {}

function assertInternal(session: AuthSession) {
  if (session.role === "vendor") throw new VendorError("akses_ditolak");
}

export async function cariVendor(session: AuthSession, filter: FilterVendor): Promise<VendorRingkas[]> {
  assertInternal(session);
  const { data, error } = await adminDb().rpc("cari_vendor", {
    p_kata_kunci: filter.kata_kunci ?? null,
    p_kategori: filter.kategori ?? null,
    p_tipe: filter.tipe ?? null,
    p_wilayah: filter.wilayah ?? null,
    p_status: filter.status === undefined ? "aktif" : filter.status,
    p_limit: filter.limit ?? 20,
  });
  if (error) throw new Error(`cari_vendor failed: ${error.code}`);
  return (data ?? []) as VendorRingkas[];
}

export async function detailVendor(session: AuthSession, id: string): Promise<VendorDetail | null> {
  if (!UUID.test(id)) return null;
  if (session.role === "vendor" && session.vendorId !== id) return null;
  const { data, error } = await adminDb().rpc("detail_vendor", { p_vendor_id: id });
  if (error) throw new Error(`detail_vendor failed: ${error.code}`);
  return (data ?? null) as VendorDetail | null;
}

/** Finds one vendor by tax number or name. A vendor account can only ever get its own record. */
export async function temukanVendor(session: AuthSession, cari: { nama?: string; npwp?: string }) {
  if (session.role === "vendor") {
    const vendor = session.vendorId ? await detailVendor(session, session.vendorId) : null;
    return { vendor, kandidat_lain: [] as string[] };
  }

  if (cari.npwp) {
    const { data, error } = await adminDb().from("vendors").select("id").eq("npwp", cari.npwp.trim()).maybeSingle();
    if (error) throw new Error(`npwp lookup failed: ${error.code}`);
    if (data) return { vendor: await detailVendor(session, data.id), kandidat_lain: [] as string[] };
  }

  if (!cari.nama) return { vendor: null, kandidat_lain: [] as string[] };
  const hasil = await cariVendor(session, { kata_kunci: cari.nama, status: null, limit: 5 });
  if (hasil.length === 0) return { vendor: null, kandidat_lain: [] as string[] };
  return {
    vendor: await detailVendor(session, hasil[0].id),
    kandidat_lain: hasil.slice(1, 4).map((item) => item.nama),
  };
}

export async function daftarKategori(): Promise<Kategori[]> {
  const { data, error } = await adminDb().from("service_categories").select("id, nama, tipe").order("id");
  if (error) throw new Error(`categories failed: ${error.code}`);
  return data ?? [];
}

/** Builds the registration form. It reads only; saving happens after a person submits the form. */
export async function formDaftarVendor(
  session: AuthSession,
  prefill: { nama?: string; npwp?: string; alamat?: string; wilayah?: string; kontak?: string; tipe?: string },
  vendorId?: string,
): Promise<FormDaftarOutput> {
  if (session.role !== "admin_pengadaan" && session.role !== "vendor") throw new VendorError("akses_ditolak");
  const kategori = await daftarKategori();
  const targetId = session.role === "vendor" ? session.vendorId : vendorId;

  if (targetId) {
    const own = await detailVendor(session, targetId);
    if (!own) throw new VendorError("vendor_tidak_ditemukan");
    if (own.status === "aktif" && session.role === "admin_pengadaan") {
      const pending = await daftarVendorDenganUsulanPending(session, [own.id]);
      if (pending.has(own.id)) {
        return {
          mode: "tidak_bisa",
          status: own.status,
          pesan: "Vendor sudah memiliki usulan yang menunggu keputusan Kepala Dinas.",
        };
      }
    }
    if (own.status !== "draft" && !(session.role === "admin_pengadaan" && own.status === "aktif")) {
      return {
        mode: "tidak_bisa",
        status: own.status,
        pesan: "Data vendor ini tidak dapat diubah dari halaman ini.",
      };
    }
    return {
      mode: own.status === "draft" ? "perbarui" : "ajukan_perubahan",
      vendor_id: own.id,
      prefill: {
        nama: own.nama,
        npwp: own.npwp ?? undefined,
        alamat: own.alamat ?? undefined,
        wilayah: own.wilayah ?? undefined,
        kontak: own.kontak ?? undefined,
        tipe: own.tipe,
        kapasitas_proyek: own.kapasitas_proyek,
        total_tenaga: own.total_tenaga,
        layanan: own.layanan.map((item) => ({
          category_id: item.category_id,
          nama_layanan: item.nama_layanan,
          deskripsi: item.deskripsi ?? undefined,
          harga_min: item.harga_min,
          harga_maks: item.harga_maks,
          satuan: item.satuan ?? "",
        })),
      },
      kategori,
    };
  }

  return { mode: "baru", vendor_id: null, prefill, kategori };
}

export async function daftarVendorDenganUsulanPending(session: AuthSession, vendorIds: string[]) {
  if (session.role !== "admin_pengadaan" || vendorIds.length === 0) return new Set<string>();

  const { data, error } = await adminDb()
    .from("approvals")
    .select("payload")
    .in("jenis", ["vendor_activation", "vendor_update", "vendor_archive"])
    .eq("status", "pending");
  if (error) throw new Error(`pending vendor approvals failed: ${error.code}`);

  const vendorIdSet = new Set(vendorIds);
  return new Set(
    (data ?? [])
      .map((item) => payloadString(item.payload, "vendor_id"))
      .filter((id): id is string => id !== undefined && vendorIdSet.has(id)),
  );
}

function payloadString(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !(key in payload)) return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/** Saves a registration as a draft. It can never activate a vendor. */
export async function simpanDraftVendor(session: AuthSession, data: DraftVendor, vendorId?: string | null) {
  if (session.role !== "admin_pengadaan" && session.role !== "vendor") throw new VendorError("akses_ditolak");
  const { data: id, error } = await adminDb().rpc("simpan_draft_vendor", {
    p_actor: session.userId,
    p_vendor_id: session.role === "vendor" ? session.vendorId : (vendorId ?? null),
    p_data: data,
  });
  if (error) {
    if (error.code === "23505") throw new VendorError("npwp_terdaftar");
    if (["akses_ditolak", "bukan_draft", "vendor_tidak_ditemukan"].includes(error.message)) {
      throw new VendorError(error.message);
    }
    throw new Error(`simpan_draft_vendor failed: ${error.code}`);
  }
  return id as string;
}

export async function ajukanPerubahanVendor(session: AuthSession, vendorId: string, data: DraftVendor) {
  if (session.role !== "admin_pengadaan") throw new VendorError("akses_ditolak");
  const { data: result, error } = await adminDb().rpc("ajukan_perubahan_vendor", {
    p_actor: session.userId,
    p_vendor_id: vendorId,
    p_data: data,
  });
  if (error) {
    if (error.code === "23505" || error.message === "npwp_terdaftar") throw new VendorError("npwp_terdaftar");
    if (
      [
        "akses_ditolak",
        "vendor_tidak_valid",
        "vendor_sudah_memiliki_usulan",
        "kapasitas_tidak_cukup",
        "data_tidak_valid",
        "kategori_tidak_valid",
      ].includes(error.message)
    ) {
      throw new VendorError(error.message);
    }
    throw new Error(`ajukan_perubahan_vendor failed: ${error.code}`);
  }
  return result as { approval_id: string; status: "pending" };
}

export async function ajukanArsipVendor(session: AuthSession, vendorId: string) {
  if (session.role !== "admin_pengadaan") throw new VendorError("akses_ditolak");
  const { data: result, error } = await adminDb().rpc("ajukan_arsip_vendor", {
    p_actor: session.userId,
    p_vendor_id: vendorId,
  });
  if (error) {
    if (
      ["akses_ditolak", "vendor_tidak_valid", "vendor_sudah_memiliki_usulan", "vendor_memiliki_penugasan_aktif"].includes(
        error.message,
      )
    ) {
      throw new VendorError(error.message);
    }
    throw new Error(`ajukan_arsip_vendor failed: ${error.code}`);
  }
  return result as { approval_id: string; status: "pending" };
}
