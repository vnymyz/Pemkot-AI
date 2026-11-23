import { StackLabels } from "@/components/ui/stack-labels";
import { Plus, Search, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorActions } from "@/components/vendor/VendorActions";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { VendorStatusBadge } from "@/components/ui/status-badge";
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

  const isAdmin = session.role === "admin_pengadaan";
  const filtered = Boolean(q || kategori || tipe || status);

  return (
    <div>
      <PageHeader
        title="Vendor"
        description="Semua vendor terdaftar. Buka satu untuk melihat data dan dokumennya."
        actions={
          isAdmin ? (
            <Link
              data-tour="vendor-tambah"
              href="/vendor/baru"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy"
            >
              <Plus aria-hidden className="size-4" />
              Tambah vendor
            </Link>
          ) : null
        }
      />

      <div data-tour="vendor-filter">
      <LiveSearchForm action="/vendor" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]">
        <label>
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
        <label>
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
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-surface transition-colors hover:bg-navy"
        >
          <Search aria-hidden className="size-4" />
        </button>
      </LiveSearchForm>
      </div>

      <p className="mt-4 text-table text-muted" aria-live="polite">
        {vendors.length} vendor ditemukan
        {filtered ? (
          <>
            {" "}
            <Link href="/vendor" className="font-medium text-primary hover:underline">Hapus filter</Link>
          </>
        ) : null}
      </p>

      {vendors.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-surface">
          <EmptyState
            icon={Store}
            title={filtered ? "Tidak ada vendor yang sesuai" : "Belum ada vendor"}
            description={
              filtered
                ? "Coba kata kunci lain atau hapus filter yang aktif."
                : isAdmin
                  ? "Tambahkan vendor pertama untuk mulai."
                  : undefined
            }
            action={filtered ? { label: "Hapus filter", href: "/vendor" } : isAdmin ? { label: "Tambah vendor", href: "/vendor/baru" } : undefined}
          />
        </div>
      ) : (
        <div data-tour="vendor-tabel" className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="ledger min-w-[860px]">
              <thead>
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-right">No</th>
                  <th scope="col" className="min-w-48 px-4 py-3">Vendor</th>
                  <th scope="col" className="min-w-44 px-4 py-3">Kategori dan wilayah</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Kisaran harga</th>
                  <th scope="col" className="px-4 py-3 text-right">Kapasitas</th>
                  {isAdmin ? <th scope="col" className="px-4 py-3">Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {paged.rows.map((vendor, index) => (
                  <tr key={vendor.id}>
                    <td className="px-4 py-3.5 text-right text-muted tabular-nums">{paged.start + index}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/vendor/${vendor.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                        {vendor.nama}
                      </Link>
                      <span className="block font-mono text-caption text-muted">{vendor.npwp}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {vendor.kategori.join(", ")}
                      <span className="block text-caption text-muted">{vendor.wilayah}</span>
                    </td>
                    <td className="px-4 py-3.5"><VendorStatusBadge status={vendor.status} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{formatRentangHarga(vendor.harga_min, vendor.harga_maks)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {vendor.kapasitas_proyek} proyek
                      <span className="block text-caption text-muted">{vendor.total_tenaga} tenaga</span>
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3.5">
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
<StackLabels />
          </div>
          <Pagination paged={paged} path="/vendor" query={params} label="vendor" />
        </div>
      )}
    </div>
  );
}
