import { ArrowLeft, CircleX, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KartuVendorSiap } from "@/components/cards/KartuRekomendasi";
import { Pagination } from "@/components/ui/pagination";
import { ProjectStatusBadge, VendorStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { rekomendasiProyek } from "@/lib/services/recommendation";

export const metadata: Metadata = { title: "Rekomendasi Vendor | Pemkot-AI" };

const th = "px-3 py-2 font-semibold";
const td = "px-3 py-2";

export default async function RekomendasiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await rekomendasiProyek(state.session, id);
  if (!data) notFound();

  const gugur = paginate(data.gugur, query.hal);
  const path = `/proyek/${data.proyek.id}/rekomendasi`;

  return (
    <div className="max-w-5xl space-y-4">
      <Link href={`/proyek/${data.proyek.id}`} className="inline-flex min-h-11 items-center gap-2 text-table font-medium text-primary">
        <ArrowLeft aria-hidden className="size-4" />
        Kembali ke detail proyek
      </Link>

      <div>
        <p className="text-caption font-medium text-muted">Rekomendasi vendor</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-page font-semibold text-navy">{data.proyek.judul}</h1>
          <ProjectStatusBadge status={data.proyek.status} />
        </div>
        <p className="mt-1 text-table text-muted">
          <span className="font-mono">{data.proyek.nomor}</span> · {data.proyek.opd} ·{" "}
          {formatTanggal(data.proyek.mulai)} sampai {formatTanggal(data.proyek.selesai)} · Anggaran{" "}
          {formatRupiah(data.proyek.anggaran)}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-surface p-4">
          <dt className="text-caption text-muted">Vendor ready</dt>
          <dd className="text-page font-semibold text-ok tabular-nums">{data.jumlah_ready}</dd>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <dt className="text-caption text-muted">Vendor gugur</dt>
          <dd className="text-page font-semibold text-bad tabular-nums">{data.jumlah_gugur}</dd>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <dt className="text-caption text-muted">Kebutuhan</dt>
          <dd className="text-table">
            {data.kebutuhan.map((item) => (
              <span key={item.kategori} className="block">
                {item.kategori}, min. {item.tenaga_min} tenaga
                {item.sertifikat_wajib.length ? `, ${item.sertifikat_wajib.join(", ")}` : ""}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <p className="flex items-start gap-2 rounded-md border border-line bg-primary-soft p-3 text-table text-primary">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        Skor dihitung otomatis dari database. Rekomendasi bukan keputusan. Penugasan tetap memerlukan persetujuan Kepala Dinas.
      </p>

      <section aria-labelledby="ready" className="space-y-3">
        <h2 id="ready" className="text-section font-semibold text-navy">Vendor ready</h2>
        {data.ready.length === 0 ? (
          <div className="rounded-md border border-warn bg-surface p-4 text-table text-warn">
            <p className="flex items-start gap-2 font-medium">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              Belum ada vendor yang memenuhi semua syarat wajib.
            </p>
            {data.alasan_terbanyak.length > 0 ? (
              <ul className="mt-2 list-disc pl-6">
                {data.alasan_terbanyak.map((item) => (
                  <li key={item.alasan}>{item.alasan} ({item.jumlah} vendor)</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2">Coba geser periode, kurangi tenaga minimal, atau periksa kategori lain.</p>
          </div>
        ) : (
          data.ready.map((vendor) => <KartuVendorSiap key={vendor.vendor_id} vendor={vendor} />)
        )}
      </section>

      {data.gugur.length > 0 ? (
        <section aria-labelledby="gugur" className="space-y-3">
          <h2 id="gugur" className="text-section font-semibold text-navy">Vendor yang gugur</h2>
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-table">
                <thead className="bg-primary-soft">
                  <tr>
                    <th scope="col" className={`${th} w-12 text-right`}>No</th>
                    <th scope="col" className={th}>Vendor</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={th}>Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {gugur.rows.map((vendor, index) => (
                    <tr key={vendor.vendor_id}>
                      <td className={`${td} text-right text-muted tabular-nums`}>{gugur.start + index}</td>
                      <td className={td}>
                        <Link href={`/vendor/${vendor.vendor_id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                          {vendor.nama}
                        </Link>
                      </td>
                      <td className={td}><VendorStatusBadge status={vendor.status} /></td>
                      <td className={td}>
                        {vendor.alasan_gugur.map((alasan) => (
                          <span key={alasan} className="flex items-start gap-1.5 text-bad">
                            <CircleX aria-hidden className="mt-1 size-3.5 shrink-0" />
                            {alasan}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination paged={gugur} path={path} query={query} label="vendor" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
