import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FormDaftarVendor } from "@/components/cards/FormDaftarVendor";
import { Pagination } from "@/components/ui/pagination";
import { CertStatusBadge, NoHistoryBadge, VendorStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRentangHarga, formatTanggal, TIPE_LABEL } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { detailVendor, formDaftarVendor } from "@/lib/services/vendor";

export const metadata: Metadata = { title: "Detail Vendor | Pemkot-AI" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 text-card font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const th = "px-3 py-2 font-semibold";
const td = "px-3 py-2";

const DETAIL_PAGE_SIZE = 5;

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const vendor = await detailVendor(state.session, id);
  if (!vendor) notFound();

  const layanan = paginate(vendor.layanan, query.hal_layanan, DETAIL_PAGE_SIZE);
  const sertifikat = paginate(vendor.sertifikat, query.hal_sertifikat, DETAIL_PAGE_SIZE);

  const canEdit =
    (vendor.status === "draft" && (state.session.role === "admin_pengadaan" || state.session.role === "vendor")) ||
    (vendor.status === "aktif" && state.session.role === "admin_pengadaan");
  const draftForm = canEdit ? await formDaftarVendor(state.session, {}, vendor.id) : null;

  const profile: [string, string][] = [
    ["NPWP", vendor.npwp ?? "Tidak ada data"],
    ["Tipe", TIPE_LABEL[vendor.tipe] ?? vendor.tipe],
    ["Wilayah", vendor.wilayah ?? "Tidak ada data"],
    ["Alamat", vendor.alamat ?? "Tidak ada data"],
    ["Kontak", vendor.kontak ?? "Tidak ada data"],
    ["Diperbarui", formatTanggal(vendor.diperbarui)],
  ];
  const stats: [string, string][] = [
    ["Sisa proyek", `${vendor.beban.sisa_proyek} dari ${vendor.kapasitas_proyek}`],
    ["Sisa tenaga", `${vendor.beban.sisa_tenaga} dari ${vendor.total_tenaga}`],
    ["Proyek berjalan", String(vendor.beban.proyek_berjalan)],
  ];

  return (
    <div className="max-w-5xl space-y-4">
      {state.session.role === "vendor" ? null : (
        <Link href="/vendor" className="inline-flex min-h-11 items-center gap-2 text-table font-medium text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          Kembali ke daftar vendor
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-page font-semibold text-navy">{vendor.nama}</h1>
        <VendorStatusBadge status={vendor.status} />
      </div>

      {vendor.peringatan.length > 0 ? (
        <div role="status" className="rounded-md border border-warn bg-surface p-3 text-table text-warn">
          {vendor.peringatan.map((item) => (
            <p key={item} className="flex items-start gap-2">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {item}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Profil">
          <dl className="divide-y divide-line text-table">
            {profile.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-4 py-2 sm:grid-cols-3">
                <dt className="text-muted">{label}</dt>
                <dd className={`break-words sm:col-span-2 ${label === "NPWP" ? "font-mono" : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
        <Section title="Kapasitas dan kinerja">
          <dl className="divide-y divide-line text-table">
            {stats.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-4 py-2 sm:grid-cols-3">
                <dt className="text-muted">{label}</dt>
                <dd className="tabular-nums sm:col-span-2">{value}</dd>
              </div>
            ))}
            <div className="grid gap-1 px-4 py-2 sm:grid-cols-3">
              <dt className="text-muted">Penilaian</dt>
              <dd className="sm:col-span-2">
                {vendor.penilaian.jumlah === 0 ? (
                  <NoHistoryBadge />
                ) : (
                  <span className="tabular-nums">
                    {vendor.penilaian.rata_rata} dari 5, {vendor.penilaian.tepat_waktu_persen}% tepat waktu
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </Section>
      </div>

      {draftForm ? <FormDaftarVendor key={vendor.diperbarui} data={draftForm} /> : null}

      <Section title="Katalog barang dan jasa">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-table">
            <thead className="bg-primary-soft">
              <tr>
                <th scope="col" className={`${th} w-12 text-right`}>No</th>
                <th scope="col" className={th}>Layanan</th>
                <th scope="col" className={th}>Kategori</th>
                <th scope="col" className={th}>Kisaran harga</th>
                <th scope="col" className={th}>Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {layanan.rows.map((item, index) => (
                <tr key={item.id}>
                  <td className={`${td} text-right text-muted tabular-nums`}>{layanan.start + index}</td>
                  <td className={td}>
                    <span className="font-medium">{item.nama_layanan}</span>
                    {item.deskripsi ? <span className="block text-caption text-muted">{item.deskripsi}</span> : null}
                  </td>
                  <td className={td}>{item.kategori}</td>
                  <td className={td}>{formatRentangHarga(item.harga_min, item.harga_maks)}</td>
                  <td className={td}>{item.satuan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination paged={layanan} path={`/vendor/${vendor.id}`} query={query} param="hal_layanan" label="layanan" />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Sertifikat">
          {vendor.sertifikat.length === 0 ? (
            <p className="p-4 text-table text-muted">Belum ada sertifikat.</p>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-table">
                <thead className="bg-primary-soft">
                  <tr>
                    <th scope="col" className={`${th} w-12 text-right`}>No</th>
                    <th scope="col" className={th}>Jenis</th>
                    <th scope="col" className={th}>Berlaku sampai</th>
                    <th scope="col" className={th}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sertifikat.rows.map((item, index) => (
                    <tr key={`${item.jenis}-${item.nomor}`}>
                      <td className={`${td} text-right text-muted tabular-nums`}>{sertifikat.start + index}</td>
                      <td className={td}>
                        {item.jenis}
                        <span className="block font-mono text-caption text-muted">{item.nomor}</span>
                      </td>
                      <td className={td}>{formatTanggal(item.berlaku_sampai)}</td>
                      <td className={td}><CertStatusBadge status={item.status_berlaku} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination paged={sertifikat} path={`/vendor/${vendor.id}`} query={query} param="hal_sertifikat" label="sertifikat" />
            </>
          )}
        </Section>
        <Section title="Periode tidak tersedia">
          {vendor.tidak_tersedia.length === 0 ? (
            <p className="p-4 text-table text-muted">Tidak ada periode tidak tersedia.</p>
          ) : (
            <ul className="divide-y divide-line text-table">
              {vendor.tidak_tersedia.map((item) => (
                <li key={item.mulai} className="px-4 py-2">
                  {formatTanggal(item.mulai)} sampai {formatTanggal(item.selesai)}
                  {item.alasan ? <span className="block text-caption text-muted">{item.alasan}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
