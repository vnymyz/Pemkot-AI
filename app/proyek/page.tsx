import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { Pagination } from "@/components/ui/pagination";
import { ProjectStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { daftarOpd, daftarProyek } from "@/lib/services/project";
import { PRIORITAS_LABEL, PROJECT_STATUS, PROJECT_STATUS_LABEL } from "@/lib/services/project-types";

export const metadata: Metadata = { title: "Proyek | Pemkot-AI" };

const field = "h-11 w-full panel rounded-md border border-line bg-surface px-3 text-table text-text";
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 120) : "");

export default async function ProyekPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { session } = state;
  const params = await searchParams;

  const q = one(params.q);
  const status = one(params.status);
  const dinas = one(params.dinas);
  const tanpaVendor = one(params.tanpa_vendor) === "1";
  const canFilterOpd = session.role === "admin_pengadaan" || session.role === "kepala_dinas";
  const isVendor = session.role === "vendor";

  const [opd, proyek] = await Promise.all([
    canFilterOpd ? daftarOpd() : Promise.resolve([]),
    daftarProyek(session, {
      kata_kunci: q || undefined,
      status: (PROJECT_STATUS as readonly string[]).includes(status) ? status : undefined,
      dinas: canFilterOpd && dinas ? dinas : undefined,
      tanpa_vendor: tanpaVendor,
      limit: 200,
    }),
  ]);
  const paged = paginate(proyek, params.hal);

  return (
    <div>
      <h1 className="text-page font-semibold text-navy">{isVendor ? "Proyek Saya" : "Proyek"}</h1>
      <p className="mt-1 text-table text-muted">
        {proyek.length} proyek ditemukan
        {session.role === "pic_proyek" && session.opdNama ? ` di ${session.opdNama}` : ""}.
      </p>

      <LiveSearchForm action="/proyek" className="mt-4 grid items-center gap-3 panel rounded-md border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="sr-only">Cari judul atau nomor proyek</span>
          <input name="q" defaultValue={q} placeholder="Cari judul atau nomor proyek" className={field} />
        </label>
        <label>
          <span className="sr-only">Status proyek</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Semua status</option>
            {PROJECT_STATUS.map((item) => (
              <option key={item} value={item}>
                {PROJECT_STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        {canFilterOpd ? (
          <label>
            <span className="sr-only">Perangkat daerah</span>
            <select name="dinas" defaultValue={dinas} className={field}>
              <option value="">Semua dinas</option>
              {opd.map((item) => (
                <option key={item.id} value={item.kode}>
                  {item.nama}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          {isVendor ? (
            <span />
          ) : (
            <label className="flex min-h-11 items-center gap-2 text-table">
              <input type="checkbox" name="tanpa_vendor" value="1" defaultChecked={tanpaVendor} className="size-4 accent-primary" />
              Belum ada vendor
            </label>
          )}
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

      {proyek.length === 0 ? (
        <p className="mt-4 panel rounded-md border border-line bg-surface p-6 text-center text-table text-muted">
          {isVendor ? "Belum ada proyek yang ditugaskan kepada vendor ini." : "Belum ada proyek yang sesuai. Coba ubah kata kunci atau filter."}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden panel rounded-md border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-table">
              <thead className="bg-primary-soft font-semibold">
                <tr>
                  <th scope="col" className="w-12 px-3 py-2 text-right">No</th>
                  <th scope="col" className="px-3 py-2">Proyek</th>
                  <th scope="col" className="px-3 py-2">Dinas</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Periode</th>
                  {isVendor ? null : <th scope="col" className="px-3 py-2 text-right">Anggaran</th>}
                  <th scope="col" className="px-3 py-2">Kebutuhan</th>
                  <th scope="col" className="px-3 py-2">Vendor</th>
                  <th scope="col" className="px-3 py-2">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.rows.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">{paged.start + index}</td>
                    <td className="px-3 py-2">
                      <Link href={`/proyek/${item.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                        {item.judul}
                      </Link>
                      <span className="block font-mono text-caption text-muted">{item.nomor}</span>
                    </td>
                    <td className="px-3 py-2">{item.opd}</td>
                    <td className="px-3 py-2"><ProjectStatusBadge status={item.status} /></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatTanggal(item.mulai)}
                      <span className="block text-caption text-muted">sampai {formatTanggal(item.selesai)}</span>
                    </td>
                    {isVendor ? null : <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{formatRupiah(item.anggaran)}</td>}
                    <td className="px-3 py-2">
                      {item.kategori.join(", ")}
                      <span className="block text-caption text-muted">
                        Min. {item.tenaga_min} tenaga{item.sertifikat_wajib.length ? `, ${item.sertifikat_wajib.join(", ")}` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {item.vendor.length ? item.vendor.join(", ") : <span className="text-muted">Belum ada</span>}
                      {item.jumlah_usulan > 0 ? (
                        <span className="block text-caption text-warn">{item.jumlah_usulan} usulan menunggu</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{item.prioritas ? PRIORITAS_LABEL[item.prioritas] : "Tidak ada data"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination paged={paged} path="/proyek" query={params} label="proyek" />
        </div>
      )}
    </div>
  );
}
