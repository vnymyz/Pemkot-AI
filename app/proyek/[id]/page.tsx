import { StackLabels } from "@/components/ui/stack-labels";
import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { AssignmentStatusBadge, ProjectStatusBadge } from "@/components/ui/status-badge";
import { getSessionState } from "@/lib/auth/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { detailProyek } from "@/lib/services/project";
import { PRIORITAS_LABEL } from "@/lib/services/project-types";

export const metadata: Metadata = { title: "Detail Proyek | Pemkot-AI" };

const DETAIL_PAGE_SIZE = 5;
const th = "px-3 py-2 font-semibold";
const td = "px-3 py-2";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 text-card font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProyekDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const proyek = await detailProyek(state.session, id);
  if (!proyek) notFound();

  const isVendor = state.session.role === "vendor";
  const kebutuhan = paginate(proyek.kebutuhan, query.hal_kebutuhan, DETAIL_PAGE_SIZE);
  const penugasan = paginate(proyek.penugasan, query.hal_penugasan, DETAIL_PAGE_SIZE);

  const info: [string, string][] = [
    ["Nomor", proyek.nomor],
    ["Dinas", proyek.opd],
    ["Periode", `${formatTanggal(proyek.mulai)} sampai ${formatTanggal(proyek.selesai)}`],
    ...(isVendor ? [] : ([["Anggaran", formatRupiah(proyek.anggaran)]] as [string, string][])),
    ["Wilayah", proyek.wilayah ?? "Tidak ada data"],
    ["Prioritas", proyek.prioritas ? PRIORITAS_LABEL[proyek.prioritas] : "Tidak ada data"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={proyek.judul}
        breadcrumb={[{ label: isVendor ? "Proyek Saya" : "Proyek", href: "/proyek" }, { label: proyek.nomor }]}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={proyek.status} />
            {proyek.deskripsi ? <span>{proyek.deskripsi}</span> : null}
          </span>
        }
        actions={
          !isVendor && ["rencana", "mencari_vendor", "ditunda"].includes(proyek.status) ? (
            <Link
              href={`/proyek/${proyek.id}/rekomendasi`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy"
            >
              <ListChecks aria-hidden className="size-4" />
              Lihat vendor yang siap
            </Link>
          ) : null
        }
      />

      <Section title="Informasi proyek">
        <dl className="divide-y divide-line text-table">
          {info.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-4 py-2 sm:grid-cols-4">
              <dt className="text-muted">{label}</dt>
              <dd className={`break-words sm:col-span-3 ${label === "Nomor" ? "font-mono" : ""}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Kebutuhan">
        {proyek.kebutuhan.length === 0 ? (
          <p className="p-4 text-table text-muted">Kebutuhan proyek belum diisi.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-table">
                <thead className="bg-primary-soft">
                  <tr>
                    <th scope="col" className={`${th} w-12 text-right`}>No</th>
                    <th scope="col" className={th}>Kategori</th>
                    <th scope="col" className={`${th} text-right`}>Tenaga minimal</th>
                    <th scope="col" className={th}>Sertifikat wajib</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {kebutuhan.rows.map((item, index) => (
                    <tr key={item.kategori}>
                      <td className={`${td} text-right text-muted tabular-nums`}>{kebutuhan.start + index}</td>
                      <td className={td}>{item.kategori}</td>
                      <td className={`${td} text-right tabular-nums`}>{item.tenaga_min}</td>
                      <td className={td}>{item.sertifikat_wajib.join(", ") || "Tidak ada"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
<StackLabels />
            </div>
            <Pagination paged={kebutuhan} path={`/proyek/${proyek.id}`} query={query} param="hal_kebutuhan" label="kebutuhan" />
          </>
        )}
      </Section>

      <Section title={isVendor ? "Penugasan saya" : "Vendor yang ditugaskan"}>
        {proyek.penugasan.length === 0 ? (
          <p className="p-4 text-table text-muted">Belum ada vendor yang ditugaskan.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-table">
                <thead className="bg-primary-soft">
                  <tr>
                    <th scope="col" className={`${th} w-12 text-right`}>No</th>
                    <th scope="col" className={th}>Vendor</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={`${th} text-right`}>Tenaga</th>
                    <th scope="col" className={th}>Periode</th>
                    <th scope="col" className={`${th} text-right`}>Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {penugasan.rows.map((item, index) => (
                    <tr key={item.id}>
                      <td className={`${td} text-right text-muted tabular-nums`}>{penugasan.start + index}</td>
                      <td className={td}>
                        <Link href={`/vendor/${item.vendor_id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                          {item.vendor}
                        </Link>
                      </td>
                      <td className={td}><AssignmentStatusBadge status={item.status} /></td>
                      <td className={`${td} text-right tabular-nums`}>{item.tenaga_dialokasikan}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {formatTanggal(item.mulai)} sampai {formatTanggal(item.selesai)}
                      </td>
                      <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{formatRupiah(item.nilai)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
<StackLabels />
            </div>
            <Pagination paged={penugasan} path={`/proyek/${proyek.id}`} query={query} param="hal_penugasan" label="penugasan" />
          </>
        )}
      </Section>
    </div>
  );
}
