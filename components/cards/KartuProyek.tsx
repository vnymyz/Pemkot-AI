import Link from "next/link";
import { AssignmentStatusBadge, ProjectStatusBadge } from "@/components/ui/status-badge";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { ProyekDetail, ProyekRingkas } from "@/lib/services/project-types";

const detailLink =
  "inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-table font-medium text-primary hover:bg-primary-soft";

export function KartuDaftarProyek({ data }: { data: { jumlah: number; proyek: ProyekRingkas[] } }) {
  if (data.proyek.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface p-4 text-table text-muted">
        Belum ada proyek yang sesuai. Coba ubah kata kunci, status, atau periode.
      </p>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {data.proyek.map((item) => (
        <article key={item.id} className="flex flex-col rounded-md border border-line bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-card font-semibold text-navy">{item.judul}</h3>
            <ProjectStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-caption text-muted">
            <span className="font-mono">{item.nomor}</span> · {item.opd}
          </p>
          <dl className="mt-3 grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-table">
            <div className="col-span-2">
              <dt className="text-caption text-muted">Periode</dt>
              <dd>{formatTanggal(item.mulai)} sampai {formatTanggal(item.selesai)}</dd>
            </div>
            {item.anggaran === null ? null : (
              <div className="col-span-2">
                <dt className="text-caption text-muted">Anggaran</dt>
                <dd className="tabular-nums">{formatRupiah(item.anggaran)}</dd>
              </div>
            )}
            <div>
              <dt className="text-caption text-muted">Kebutuhan</dt>
              <dd>{item.kategori.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted">Syarat</dt>
              <dd>
                Min. {item.tenaga_min} tenaga
                {item.sertifikat_wajib.length ? `, ${item.sertifikat_wajib.join(", ")}` : ""}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-caption text-muted">Vendor</dt>
              <dd>
                {item.vendor.length ? item.vendor.join(", ") : "Belum ada"}
                {item.jumlah_usulan > 0 ? <span className="text-warn"> ({item.jumlah_usulan} usulan menunggu)</span> : null}
              </dd>
            </div>
          </dl>
          <div className="mt-3">
            <Link href={`/proyek/${item.id}`} className={detailLink}>Lihat detail proyek</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function KartuDetailProyek({ data }: { data: { proyek: ProyekDetail } }) {
  const { proyek } = data;
  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-card font-semibold text-navy">{proyek.judul}</h3>
          <p className="text-caption text-muted">
            <span className="font-mono">{proyek.nomor}</span> · {proyek.opd}
          </p>
        </div>
        <ProjectStatusBadge status={proyek.status} />
      </div>

      <dl className="mt-3 grid gap-3 text-table sm:grid-cols-2">
        <div>
          <dt className="text-caption text-muted">Periode</dt>
          <dd>{formatTanggal(proyek.mulai)} sampai {formatTanggal(proyek.selesai)}</dd>
        </div>
        {proyek.anggaran === null ? null : (
          <div>
            <dt className="text-caption text-muted">Anggaran</dt>
            <dd className="tabular-nums">{formatRupiah(proyek.anggaran)}</dd>
          </div>
        )}
      </dl>

      <h4 className="mt-4 text-table font-semibold">Kebutuhan</h4>
      <ul className="mt-1 divide-y divide-line text-table">
        {proyek.kebutuhan.map((item) => (
          <li key={item.kategori} className="flex flex-wrap justify-between gap-x-3 py-1.5">
            <span>{item.kategori}</span>
            <span className="text-muted">
              Min. {item.tenaga_min} tenaga{item.sertifikat_wajib.length ? `, ${item.sertifikat_wajib.join(", ")}` : ""}
            </span>
          </li>
        ))}
      </ul>

      <h4 className="mt-4 text-table font-semibold">Vendor yang ditugaskan</h4>
      {proyek.penugasan.length === 0 ? (
        <p className="mt-1 text-table text-muted">Belum ada vendor yang ditugaskan.</p>
      ) : (
        <ul className="mt-1 divide-y divide-line text-table">
          {proyek.penugasan.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
              <span>{item.vendor}, {item.tenaga_dialokasikan} tenaga</span>
              <AssignmentStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <Link href={`/proyek/${proyek.id}`} className={detailLink}>Lihat detail proyek</Link>
      </div>
    </article>
  );
}
