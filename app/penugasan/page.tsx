import { StackLabels } from "@/components/ui/stack-labels";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { Pagination } from "@/components/ui/pagination";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { daftarPenugasan } from "@/lib/services/project";
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_LABEL } from "@/lib/services/project-types";

export const metadata: Metadata = { title: "Penugasan | Pemkot-AI" };

const field = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-table text-text";
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
      <PageHeader
        title={isVendor ? "Penugasan Saya" : "Penugasan"}
        description={
          isVendor
            ? "Pekerjaan yang sudah disetujui untuk vendor Bapak/Ibu."
            : "Vendor yang ditugaskan pada proyek. Usulan baru menunggu keputusan Kepala Dinas."
        }
      />

      <LiveSearchForm action="/penugasan" className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
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
        <div data-tour="penugasan-tabel" className="mt-4 rounded-lg border border-line bg-surface">
          <EmptyState
            title={isVendor ? "Belum ada penugasan" : "Tidak ada penugasan yang sesuai"}
            description={
              isVendor
                ? "Penugasan muncul di sini setelah Kepala Dinas menyetujui usulan untuk vendor Bapak/Ibu."
                : "Coba kata kunci lain atau hapus filter. Usulan baru dibuat dari halaman vendor yang siap pada sebuah proyek."
            }
            action={isVendor ? undefined : { label: "Lihat proyek", href: "/proyek" }}
          />
        </div>
      ) : (
        <div data-tour="penugasan-tabel" className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="ledger min-w-[1040px] ">
              <thead>
                <tr>
                  <th scope="col" className="w-12 px-4 py-3.5 text-right">No</th>
                  <th scope="col" className="px-4 py-3.5">Proyek</th>
                  <th scope="col" className="px-4 py-3.5">Dinas</th>
                  <th scope="col" className="px-4 py-3.5">Vendor</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Tenaga</th>
                  <th scope="col" className="px-4 py-3.5">Periode</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.rows.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5 text-right text-muted tabular-nums">{paged.start + index}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/proyek/${item.project_id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                        {item.judul}
                      </Link>
                      <span className="block font-mono text-caption text-muted">{item.nomor}</span>
                    </td>
                    <td className="px-4 py-3.5">{item.opd}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/vendor/${item.vendor_id}`} className="text-primary underline-offset-2 hover:underline">
                        {item.vendor}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5"><AssignmentStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{item.tenaga_dialokasikan}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {formatTanggal(item.mulai)}
                      <span className="block text-caption text-muted">sampai {formatTanggal(item.selesai)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">{formatRupiah(item.nilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
<StackLabels />
          </div>
          <Pagination paged={paged} path="/penugasan" query={params} label="penugasan" />
        </div>
      )}
    </div>
  );
}
