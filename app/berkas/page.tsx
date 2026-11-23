import { Download, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
      <h1 className="text-page font-semibold text-navy">Berkas</h1>
      <p className="mt-1 text-table text-muted">
        {rows.length} berkas buatan Asisten AI{isKepala ? " dari semua pengguna" : " milik Bapak/Ibu"}. Tautan unduh dibuat saat diklik
        dan berlaku 1 jam.
      </p>

      {rows.length === 0 ? (
        <div className="mt-4 panel rounded-md border border-line bg-surface p-6 text-center text-table text-muted">
          <p>Belum ada berkas. Minta Asisten AI membuat Word, Excel, atau PowerPoint dari data yang boleh Bapak/Ibu lihat.</p>
          <Link
            href="/chat"
            className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-surface hover:bg-navy"
          >
            Buka Asisten AI
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden panel rounded-md border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-table">
              <thead className="bg-primary-soft font-semibold">
                <tr>
                  <th scope="col" className="w-12 px-3 py-2 text-right">No</th>
                  <th scope="col" className="px-3 py-2">Nama berkas</th>
                  <th scope="col" className="px-3 py-2">Jenis</th>
                  <th scope="col" className="px-3 py-2">Sumber data</th>
                  <th scope="col" className="px-3 py-2 text-right">Isi</th>
                  {isKepala ? <th scope="col" className="px-3 py-2">Dibuat oleh</th> : null}
                  <th scope="col" className="px-3 py-2">Dibuat</th>
                  <th scope="col" className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.rows.map((item, index) => {
                  const jenis = JENIS[item.jenis];
                  const Icon = jenis.icon;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-right text-muted tabular-nums">{paged.start + index}</td>
                      <td className="px-3 py-2 break-all">{item.nama}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon aria-hidden className="size-4 text-primary" />
                          {jenis.label}
                        </span>
                      </td>
                      <td className="px-3 py-2">{item.sumber}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {item.jenis === "pptx" ? `${item.slide ?? 0} slide` : `${item.baris ?? 0} baris`}
                      </td>
                      {isKepala ? <td className="px-3 py-2">{item.dibuat_oleh}</td> : null}
                      <td className="px-3 py-2 whitespace-nowrap">{formatTanggal(item.created_at)}</td>
                      <td className="px-3 py-2">
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
          </div>
          <Pagination paged={paged} path="/berkas" query={query} label="berkas" />
        </div>
      )}
    </div>
  );
}
