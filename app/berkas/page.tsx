import { StackLabels } from "@/components/ui/stack-labels";
import { Download, FileSpreadsheet, Files, FileText, Presentation } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionState } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { daftarBerkas } from "@/lib/services/document";

export const metadata: Metadata = { title: "Berkas | Pemkot-AI" };

const JENIS = {
  xlsx: { label: "Excel", icon: FileSpreadsheet },
  pptx: { label: "PowerPoint", icon: Presentation },
  docx: { label: "Word", icon: FileText },
} as const;

export default async function BerkasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { session } = state;

  const query = await searchParams;
  const rows = await daftarBerkas(session);
  const paged = paginate(rows, query.hal);
  const isKepala = session.role === "kepala_dinas";

  return (
    <div>
      <PageHeader
        title="Berkas"
        description={`File yang dibuat lewat Asisten AI${isKepala ? ", dari semua pengguna" : ""}. Tautan unduh berlaku 1 jam.`}
        actions={
          <Link
            href="/chat"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy"
          >
            Buat berkas baru
          </Link>
        }
      />

      {rows.length === 0 ? (
        <div data-tour="berkas-tabel" className="mt-4 rounded-lg border border-line bg-surface">
          <EmptyState
            icon={Files}
            title="Belum ada berkas"
            description={'Minta Asisten AI membuatnya, misalnya "Buatkan Excel daftar penugasan".'}
            action={{ label: "Buka Asisten AI", href: "/chat" }}
          />
        </div>
      ) : (
        <div data-tour="berkas-tabel" className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="ledger min-w-[860px] ">
              <thead>
                <tr>
                  <th scope="col" className="w-12 px-4 py-3.5 text-right">No</th>
                  <th scope="col" className="px-4 py-3.5">Nama berkas</th>
                  <th scope="col" className="px-4 py-3.5">Jenis</th>
                  <th scope="col" className="px-4 py-3.5">Sumber data</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Isi</th>
                  {isKepala ? <th scope="col" className="px-4 py-3.5">Dibuat oleh</th> : null}
                  <th scope="col" className="px-4 py-3.5">Dibuat</th>
                  <th scope="col" className="px-4 py-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.rows.map((item, index) => {
                  const jenis = JENIS[item.jenis];
                  const Icon = jenis.icon;
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3.5 text-right text-muted tabular-nums">{paged.start + index}</td>
                      <td className="px-4 py-3.5 break-all">{item.nama}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon aria-hidden className="size-4 text-primary" />
                          {jenis.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{item.sumber}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {item.jenis === "pptx" ? `${item.slide ?? 0} slide` : `${item.baris ?? 0} baris`}
                      </td>
                      {isKepala ? <td className="px-4 py-3.5">{item.dibuat_oleh}</td> : null}
                      <td className="px-4 py-3.5 whitespace-nowrap">{formatTanggal(item.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <a
                          href={`/api/berkas/${item.id}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line px-3 font-medium text-primary hover:bg-primary-soft"
                        >
                          <Download aria-hidden className="size-4" />
                          Unduh
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
<StackLabels />
          </div>
          <Pagination paged={paged} path="/berkas" query={query} label="berkas" />
        </div>
      )}
    </div>
  );
}
