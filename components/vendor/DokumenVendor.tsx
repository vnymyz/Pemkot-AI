import { StackLabels } from "@/components/ui/stack-labels";
import { Pagination } from "@/components/ui/pagination";
import { DocStatusBadge } from "@/components/ui/status-badge";
import { formatTanggal } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import type { DokumenVendorRow } from "@/lib/services/vendor-document-types";
import { DOKUMEN_JENIS, DOKUMEN_LABEL, DOKUMEN_WAJIB, type DokumenJenis } from "@/lib/vendor-document-schema";
import { DokumenRowActions } from "./DokumenRowActions";
import { DokumenUpload } from "./DokumenUpload";

const th = "px-3 py-2 font-semibold";
const td = "px-3 py-2 align-top";
const PAGE_SIZE = 5;

/** Registration documents of one vendor: one row per document type, with the check result. */
export function DokumenVendor({
  vendorId,
  documents,
  canManage,
  isAdmin,
  query,
}: {
  vendorId: string;
  documents: DokumenVendorRow[];
  /** Admin or the owning vendor, while the vendor is a draft. */
  canManage: boolean;
  isAdmin: boolean;
  query: Record<string, string | string[] | undefined>;
}) {
  const byType = new Map<DokumenJenis, DokumenVendorRow>(documents.map((item) => [item.jenis, item]));
  const rows = DOKUMEN_JENIS.map((jenis) => ({ jenis, doc: byType.get(jenis) ?? null }));
  const paged = paginate(rows, query.hal_dokumen, PAGE_SIZE);

  return (
    <section data-tour="dokumen" className="rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 text-card font-semibold">Dokumen pendaftaran</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-table">
          <thead className="bg-primary-soft">
            <tr>
              <th scope="col" className={`${th} w-12 text-right`}>No</th>
              <th scope="col" className={th}>Jenis</th>
              <th scope="col" className={th}>File</th>
              <th scope="col" className={th}>Status</th>
              <th scope="col" className={th}>Hasil pemeriksaan</th>
              <th scope="col" className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.rows.map(({ jenis, doc }, index) => {
              const wajib = (DOKUMEN_WAJIB as readonly string[]).includes(jenis);
              const needsDecision = doc?.status_cek === "perlu_diperiksa_manual" || doc?.status_cek === "tidak_cocok";
              return (
                <tr key={jenis}>
                  <td className={`${td} text-right text-muted tabular-nums`}>{paged.start + index}</td>
                  <td className={td}>
                    <span className="font-medium">{DOKUMEN_LABEL[jenis]}</span>
                    <span className="block text-caption text-muted">{wajib ? "Wajib" : "Opsional"}</span>
                  </td>
                  <td className={td}>
                    {doc ? (
                      <>
                        <span className="break-all">{doc.nama_file}</span>
                        <span className="block text-caption text-muted">{formatTanggal(doc.created_at)}</span>
                      </>
                    ) : (
                      <span className="text-muted">Belum diunggah</span>
                    )}
                  </td>
                  <td className={td}>
                    {doc ? <DocStatusBadge status={doc.status_cek} /> : <span className="text-muted">Tidak ada</span>}
                  </td>
                  <td className={`${td} max-w-xs`}>
                    {doc?.catatan ? <span className="text-caption">{doc.catatan}</span> : <span className="text-muted">Tidak ada data</span>}
                    {doc?.diputuskan_manual ? (
                      <span className="block text-caption text-muted">Diputuskan manual oleh admin</span>
                    ) : null}
                  </td>
                  <td className={td}>
                    {doc ? (
                      <DokumenRowActions
                        id={doc.id}
                        jenis={jenis}
                        canDelete={canManage}
                        canDecide={canManage && isAdmin && needsDecision}
                      />
                    ) : (
                      <span className="text-muted">Tidak ada</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
<StackLabels />
      </div>
      <Pagination paged={paged} path={`/vendor/${vendorId}`} query={query} param="hal_dokumen" label="dokumen" />
      {canManage ? <DokumenUpload vendorId={vendorId} /> : null}
    </section>
  );
}
