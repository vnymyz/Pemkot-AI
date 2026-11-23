import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { Pagination } from "@/components/ui/pagination";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { daftarPenugasan } from "@/lib/services/project";
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_LABEL } from "@/lib/services/project-types";

export const metadata: Metadata = { title: "Penugasan | Pemkot-AI" };

const field = "h-11 w-full rounded-md border border-line bg-surface px-3 text-table text-text";
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 120) : "");

export default async function PenugasanPage({
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
  const isVendor = session.role === "vendor";
  const statusOptions = isVendor
    ? ASSIGNMENT_STATUS.filter((item) => ["disetujui", "berjalan", "selesai"].includes(item))
    : ASSIGNMENT_STATUS;

  const rows = await daftarPenugasan(session, {
    kata_kunci: q || undefined,
    status: (statusOptions as readonly string[]).includes(status) ? status : undefined,
  });
  const paged = paginate(rows, params.hal);

  return (
    <div>
      <h1 className="text-page font-semibold text-navy">{isVendor ? "Penugasan Saya" : "Penugasan"}</h1>
      <p className="mt-1 text-table text-muted">{rows.length} penugasan ditemukan.</p>

      <LiveSearchForm action="/penugasan" className="mt-4 grid gap-3 rounded-md border border-line bg-surface p-3 sm:grid-cols-[1fr_220px_auto]">
        <label>
          <span className="sr-only">Cari proyek atau vendor</span>
          <input name="q" defaultValue={q} placeholder={isVendor ? "Cari proyek" : "Cari proyek atau vendor"} className={field} />
        </label>
        <label>
          <span className="sr-only">Status penugasan</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Semua status</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {ASSIGNMENT_STATUS_LABEL[item]}
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
      </LiveSearchForm>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-md border border-line bg-surface p-6 text-center text-table text-muted">
          {isVendor ? "Belum ada penugasan untuk vendor ini." : "Belum ada penugasan yang sesuai. Coba ubah kata kunci atau filter."}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left text-table">
              <thead className="bg-primary-soft font-semibold">
                <tr>
                  <th scope="col" className="w-12 px-3 py-2 text-right">No</th>
                  <th scope="col" className="px-3 py-2">Proyek</th>
                  <th scope="col" className="px-3 py-2">Dinas</th>
                  <th scope="col" className="px-3 py-2">Vendor</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Tenaga</th>
                  <th scope="col" className="px-3 py-2">Periode</th>
                  <th scope="col" className="px-3 py-2 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.rows.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-right text-muted tabular-nums">{paged.start + index}</td>
                    <td className="px-3 py-2">
                      <Link href={`/proyek/${item.project_id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                        {item.judul}
                      </Link>
                      <span className="block font-mono text-caption text-muted">{item.nomor}</span>
                    </td>
                    <td className="px-3 py-2">{item.opd}</td>
                    <td className="px-3 py-2">
                      <Link href={`/vendor/${item.vendor_id}`} className="text-primary underline-offset-2 hover:underline">
                        {item.vendor}
                      </Link>
                    </td>
                    <td className="px-3 py-2"><AssignmentStatusBadge status={item.status} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.tenaga_dialokasikan}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatTanggal(item.mulai)}
                      <span className="block text-caption text-muted">sampai {formatTanggal(item.selesai)}</span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{formatRupiah(item.nilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination paged={paged} path="/penugasan" query={params} label="penugasan" />
        </div>
      )}
    </div>
  );
}
