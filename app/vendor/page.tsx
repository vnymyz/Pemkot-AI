import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorActions } from "@/components/vendor/VendorActions";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { Pagination } from "@/components/ui/pagination";
import { NoHistoryBadge, VendorStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRentangHarga, TIPE_LABEL } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { cariVendor, daftarKategori, daftarVendorDenganUsulanPending } from "@/lib/services/vendor";
import { VENDOR_STATUS, VENDOR_TIPE } from "@/lib/vendor-schema";

export const metadata: Metadata = { title: "Vendor | Pemkot-AI" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  verifikasi: "Verifikasi",
  aktif: "Aktif",
  ditolak: "Ditolak",
  daftar_hitam: "Daftar hitam",
  diarsipkan: "Diarsipkan",
};

const field = "h-11 w-full rounded-md border border-line bg-surface px-3 text-table text-text";
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { session } = state;

  if (session.role === "vendor") {
    if (session.vendorId) redirect(`/vendor/${session.vendorId}`);
    return (
      <div className="max-w-2xl">
        <h1 className="text-page font-semibold text-navy">Data Vendor Saya</h1>
        <p className="mt-2 text-muted">Akun ini belum terhubung ke data vendor.</p>
        <Link href="/chat" className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 font-medium text-surface">
          Daftar lewat Asisten AI
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const q = one(params.q);
  const kategori = one(params.kategori);
  const tipe = one(params.tipe);
  const status = one(params.status);

  const [kategoriList, vendors] = await Promise.all([
    daftarKategori(),
    cariVendor(session, {
      kata_kunci: q || undefined,
      kategori: kategori || undefined,
      tipe: (VENDOR_TIPE as readonly string[]).includes(tipe) ? (tipe as (typeof VENDOR_TIPE)[number]) : undefined,
      status: (VENDOR_STATUS as readonly string[]).includes(status) ? status : null,
      limit: 100,
    }),
  ]);
  const pendingVendorIds = await daftarVendorDenganUsulanPending(
    session,
    vendors.map((vendor) => vendor.id),
  );
  const paged = paginate(vendors, params.hal);

  return (
    <div>
      <h1 className="text-page font-semibold text-navy">Vendor</h1>
      <p className="mt-1 text-table text-muted">{vendors.length} vendor ditemukan.</p>

      {session.role === "admin_pengadaan" ? (
        <div className="mt-3 flex justify-end">
          <Link
            href="/vendor/baru"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface hover:bg-navy"
          >
            <Plus aria-hidden className="size-4" />
            Tambah vendor
          </Link>
        </div>
      ) : null}

      <LiveSearchForm action="/vendor" className="mt-4 grid gap-3 rounded-md border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="sr-only">Cari vendor atau layanan</span>
          <input name="q" defaultValue={q} placeholder="Cari vendor, barang, atau jasa" className={field} />
        </label>
        <label>
          <span className="sr-only">Kategori</span>
          <select name="kategori" defaultValue={kategori} className={field}>
            <option value="">Semua kategori</option>
            {kategoriList.map((item) => (
              <option key={item.id} value={item.nama}>
                {item.nama}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Semua status</option>
            {VENDOR_STATUS.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Tipe</span>
            <select name="tipe" defaultValue={tipe} className={field}>
              <option value="">Semua tipe</option>
              {VENDOR_TIPE.map((item) => (
                <option key={item} value={item}>
                  {TIPE_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            aria-label="Cari"
            title="Cari"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-surface hover:bg-navy"
          >
            <Search aria-hidden className="size-4" />
          </button>
        </div>
      </LiveSearchForm>

      {vendors.length === 0 ? (
        <p className="mt-4 rounded-md border border-line bg-surface p-6 text-center text-table text-muted">
          Belum ada vendor yang sesuai. Coba ubah kata kunci atau filter.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-table">
            <thead className="bg-primary-soft font-semibold">
              <tr>
                <th scope="col" className="w-12 px-3 py-2 text-right">No</th>
                <th scope="col" className="px-3 py-2">Vendor</th>
                <th scope="col" className="px-3 py-2">Kategori</th>
                <th scope="col" className="px-3 py-2">Wilayah</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Kisaran harga</th>
                <th scope="col" className="px-3 py-2 text-right">Kapasitas</th>
                <th scope="col" className="px-3 py-2 text-right">Tenaga</th>
                <th scope="col" className="px-3 py-2">Penilaian</th>
                {session.role === "admin_pengadaan" ? <th scope="col" className="px-3 py-2">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paged.rows.map((vendor, index) => (
                <tr key={vendor.id}>
                  <td className="px-3 py-2 text-right text-muted tabular-nums">{paged.start + index}</td>
                  <td className="px-3 py-2">
                    <Link href={`/vendor/${vendor.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                      {vendor.nama}
                    </Link>
                    <span className="block font-mono text-caption text-muted">{vendor.npwp}</span>
                  </td>
                  <td className="px-3 py-2">{vendor.kategori.join(", ")}</td>
                  <td className="px-3 py-2">{vendor.wilayah}</td>
                  <td className="px-3 py-2"><VendorStatusBadge status={vendor.status} /></td>
                  <td className="px-3 py-2">{formatRentangHarga(vendor.harga_min, vendor.harga_maks)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{vendor.kapasitas_proyek} proyek</td>
                  <td className="px-3 py-2 text-right tabular-nums">{vendor.total_tenaga}</td>
                  <td className="px-3 py-2">
                    {vendor.rating === null ? <NoHistoryBadge /> : <span className="tabular-nums">{vendor.rating} dari 5</span>}
                  </td>
                  {session.role === "admin_pengadaan" ? (
                    <td className="px-3 py-2">
                      <VendorActions
                        id={vendor.id}
                        name={vendor.nama}
                        status={vendor.status}
                        hasPendingProposal={pendingVendorIds.has(vendor.id)}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination paged={paged} path="/vendor" query={params} label="vendor" />
        </div>
      )}
    </div>
  );
}
