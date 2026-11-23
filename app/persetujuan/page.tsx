import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { getSessionState } from "@/lib/auth/session";
import { formatRentangHarga, formatRupiah, formatTanggal, TIPE_LABEL } from "@/lib/format";
import { paginate } from "@/lib/pagination";
import { daftarPersetujuan } from "@/lib/services/approval";
import { PersetujuanForm } from "./persetujuan-form";

export const metadata: Metadata = { title: "Persetujuan | Pemkot-AI" };

export default async function PersetujuanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  if (state.session.role !== "kepala_dinas") {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <EmptyState
          icon={ShieldCheck}
          title="Halaman ini khusus Kepala Dinas"
          description="Usulan yang Bapak/Ibu buat dapat dipantau di halaman Penugasan."
          action={{ label: "Buka Penugasan", href: "/penugasan" }}
        />
      </div>
    );
  }

  const query = await searchParams;
  const rows = await daftarPersetujuan(state.session);
  const paged = paginate(rows, query.hal);

  return (
    <div className="max-w-5xl space-y-4">
      <PageHeader
        title="Persetujuan"
        description="Usulan yang menunggu keputusan Bapak/Ibu. Baca rincian, tulis catatan bila perlu, lalu setujui atau tolak."
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            title="Belum ada usulan"
            description="Usulan penugasan dan perubahan vendor akan muncul di sini untuk diputuskan."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {paged.rows.map((item, position) => (
            <article key={item.id} data-tour={position === 0 ? "persetujuan-kartu" : undefined} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {item.jenis === "project_assignment" ? (
                    <>
                      <p className="text-caption text-muted">{item.project_nomor} · Usulan penugasan</p>
                      <h2 className="text-card font-semibold text-navy">{item.project_judul}</h2>
                      <p className="mt-1 text-table">Vendor: <span className="font-medium">{item.vendor_nama}</span></p>
                    </>
                  ) : (
                    <>
                      <p className="text-caption text-muted">
                        {item.jenis === "vendor_update"
                          ? "Usulan perubahan vendor"
                          : item.jenis === "vendor_archive"
                            ? "Usulan pengarsipan vendor"
                            : "Usulan aktivasi vendor"}
                      </p>
                      <h2 className="text-card font-semibold text-navy">{item.vendor_nama}</h2>
                    </>
                  )}
                </div>
                {item.status === "pending" ? (
                  <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-warn px-3 text-table font-medium text-warn">
                    <Clock aria-hidden className="size-4" />
                    Menunggu keputusan
                  </span>
                ) : item.status === "approved" ? (
                  <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-ok px-3 text-table font-medium text-ok">
                    <CircleCheck aria-hidden className="size-4" />
                    Disetujui
                  </span>
                ) : (
                  <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-bad px-3 text-table font-medium text-bad">
                    <CircleX aria-hidden className="size-4" />
                    Ditolak
                  </span>
                )}
              </div>

              <p className="mt-3 border-t border-line pt-3 text-table">
                <span className="text-caption text-muted">Pengusul: </span>{item.pengusul}
              </p>

              {item.jenis === "project_assignment" ? (
                <dl className="mt-2 grid gap-3 text-table sm:grid-cols-3">
                  <div>
                    <dt className="text-caption text-muted">Tenaga</dt>
                    <dd className="tabular-nums">{item.tenaga_dialokasikan}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted">Periode</dt>
                    <dd>{formatTanggal(item.mulai)} sampai {formatTanggal(item.selesai)}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted">Nilai</dt>
                    <dd className="tabular-nums">{formatRupiah(item.nilai)}</dd>
                  </div>
                </dl>
              ) : item.jenis === "vendor_update" ? (
                <dl className="mt-2 grid gap-3 text-table sm:grid-cols-2">
                  <div>
                    <dt className="text-caption text-muted">Nama usaha</dt>
                    <dd>{item.vendor_data.nama}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted">NPWP</dt>
                    <dd className="font-mono">{item.vendor_data.npwp}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted">Tipe dan wilayah</dt>
                    <dd>{TIPE_LABEL[item.vendor_data.tipe]} · {item.vendor_data.wilayah}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted">Kapasitas dan tenaga</dt>
                    <dd className="tabular-nums">{item.vendor_data.kapasitas_proyek} proyek · {item.vendor_data.total_tenaga} tenaga</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-caption text-muted">Alamat dan kontak</dt>
                    <dd>{item.vendor_data.alamat} · {item.vendor_data.kontak}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-caption text-muted">Katalog usulan</dt>
                    <dd>
                      <ul className="list-inside list-disc">
                        {item.vendor_data.layanan.map((layanan, index) => (
                          <li key={`${layanan.category_id}-${layanan.nama_layanan}-${index}`}>
                            {layanan.nama_layanan} · {formatRentangHarga(layanan.harga_min, layanan.harga_maks)} per {layanan.satuan}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              ) : item.jenis === "vendor_archive" ? (
                <p className="mt-2 text-table text-muted">
                  Jika disetujui, vendor akan disembunyikan dari pencarian aktif. Riwayat dan penugasan lama tetap disimpan.
                </p>
              ) : (
                <p className="mt-2 text-table text-muted">Vendor akan diaktifkan setelah keputusan disetujui.</p>
              )}

              {item.jenis !== "project_assignment" ? (
                <Link
                  href={`/vendor/${item.vendor_id}`}
                  className="mt-3 inline-flex min-h-11 items-center rounded-md border border-line px-3 text-table font-medium text-primary hover:bg-primary-soft"
                >
                  Lihat vendor
                </Link>
              ) : null}

              {item.status === "pending" ? (
                <PersetujuanForm approvalId={item.id} />
              ) : item.catatan ? (
                <p className="mt-3 border-t border-line pt-3 text-table text-muted">Catatan: {item.catatan}</p>
              ) : null}
            </article>
          ))}
          <Pagination paged={paged} path="/persetujuan" query={query} label="usulan" />
        </div>
      )}
    </div>
  );
}
