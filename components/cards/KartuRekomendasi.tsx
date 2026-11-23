"use client";

import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";
import { NoHistoryBadge, ReadyBadge } from "@/components/ui/status-badge";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { Ketersediaan, Rekomendasi, VendorSiap } from "@/lib/services/recommendation-types";

const actionLink =
  "inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-table font-medium text-primary hover:bg-primary-soft";

const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function SkorBar({ label, nilai, maks }: { label: string; nilai: number; maks: number }) {
  const persen = Math.min(Math.max((Number(nilai) / maks) * 100, 0), 100);
  return (
    <div className="grid grid-cols-[84px_1fr_64px] items-center gap-2 text-caption">
      <span className="text-muted">{label}</span>
      <span aria-hidden className="h-2 overflow-hidden rounded-sm bg-primary-soft">
        <span className="block h-full bg-primary" style={{ width: `${persen}%` }} />
      </span>
      <span className="text-right font-medium tabular-nums">
        {angka.format(Number(nilai))}/{maks}
      </span>
    </div>
  );
}

function Syarat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ok" />
      <span>{children}</span>
    </li>
  );
}

export function KartuVendorSiap({ vendor }: { vendor: VendorSiap }) {
  const first = vendor.peringkat === 1;
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-label={`Peringkat ${vendor.peringkat}`}
            className={`flex size-9 shrink-0 items-center justify-center rounded-md font-semibold tabular-nums ${
              first ? "bg-gold text-navy" : "bg-primary-soft text-primary"
            }`}
          >
            {vendor.peringkat}
          </span>
          <div className="min-w-0">
            <h3 className="text-card font-semibold text-navy">{vendor.nama}</h3>
            <p className="text-caption text-muted">{vendor.wilayah ?? "Wilayah tidak ada data"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-table">
            Skor <span className="text-section font-semibold text-navy tabular-nums">{angka.format(Number(vendor.skor))}</span>
            <span className="text-muted"> / 100</span>
          </p>
          <ReadyBadge ready />
        </div>
      </div>

      <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-line pt-3 md:grid-cols-2">
        <SkorBar label="Pengalaman" nilai={vendor.s_pengalaman} maks={25} />
        <SkorBar label="Kinerja" nilai={vendor.s_kinerja} maks={25} />
        <SkorBar label="Waktu" nilai={vendor.s_waktu} maks={15} />
        <SkorBar label="Kapasitas" nilai={vendor.s_kapasitas} maks={15} />
        <SkorBar label="Harga" nilai={vendor.s_harga} maks={10} />
        <SkorBar label="Wilayah" nilai={vendor.s_wilayah} maks={10} />
      </div>

      <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-caption md:grid-cols-2">
        <Syarat>Status aktif</Syarat>
        <Syarat>
          {vendor.sertifikat_wajib.length ? `${vendor.sertifikat_wajib.join(" dan ")} berlaku sampai proyek selesai` : "Tidak ada sertifikat wajib"}
        </Syarat>
        <Syarat>Sisa {vendor.sisa_proyek} dari {vendor.kapasitas_proyek} slot proyek</Syarat>
        <Syarat>Sisa {vendor.sisa_tenaga} tenaga, dibutuhkan {vendor.tenaga_dibutuhkan}</Syarat>
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {vendor.belum_ada_riwayat ? <NoHistoryBadge /> : <span />}
        <Link href={`/vendor/${vendor.vendor_id}`} className={actionLink}>Lihat detail vendor</Link>
      </div>
    </article>
  );
}

export function KartuRekomendasi({ data }: { data: Rekomendasi & { fokus?: boolean } }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-card font-semibold text-navy">Rekomendasi: {data.proyek.judul}</p>
        <p className="text-caption text-muted">
          <span className="font-mono">{data.proyek.nomor}</span> · {formatTanggal(data.proyek.mulai)} sampai{" "}
          {formatTanggal(data.proyek.selesai)} · {data.jumlah_ready} ready, {data.jumlah_gugur} gugur
        </p>
      </div>

      {data.ready.length === 0 && !data.fokus ? (
        <div className="rounded-md border border-warn bg-surface p-3 text-table text-warn">
          <p className="flex items-start gap-2 font-medium">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            Belum ada vendor yang memenuhi semua syarat wajib.
          </p>
        </div>
      ) : (
        data.ready.map((vendor) => <KartuVendorSiap key={vendor.vendor_id} vendor={vendor} />)
      )}

      {data.gugur.length > 0 ? (
        <details open={data.fokus} className="rounded-lg border border-line bg-surface">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-table font-medium text-primary">
            {data.fokus ? "Alasan vendor gugur" : `Lihat ${data.gugur.length} vendor yang gugur`}
          </summary>
          <ul className="divide-y divide-line border-t border-line text-table">
            {data.gugur.map((vendor) => (
              <li key={vendor.vendor_id} className="px-4 py-2">
                <Link href={`/vendor/${vendor.vendor_id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  {vendor.nama}
                </Link>
                <span className="mt-0.5 flex items-start gap-1.5 text-caption text-bad">
                  <CircleX aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {vendor.alasan_gugur.join(". ")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div>
        <Link href={`/proyek/${data.proyek.id}/rekomendasi`} className={actionLink}>Buka halaman rekomendasi</Link>
      </div>
    </div>
  );
}

export function KartuKetersediaan({ data }: { data: { ketersediaan: Ketersediaan } }) {
  const item = data.ketersediaan;
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-card font-semibold text-navy">{item.nama}</h3>
          <p className="text-caption text-muted">
            {formatTanggal(item.mulai)} sampai {formatTanggal(item.selesai)}
            {item.tenaga_diminta > 0 ? ` · butuh ${item.tenaga_diminta} tenaga` : ""}
          </p>
        </div>
        <ReadyBadge ready={item.bisa} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-table">
        <div>
          <dt className="text-caption text-muted">Sisa proyek</dt>
          <dd className="tabular-nums">{item.sisa_proyek} dari {item.kapasitas_proyek}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Sisa tenaga</dt>
          <dd className="tabular-nums">{item.sisa_tenaga} dari {item.total_tenaga}</dd>
        </div>
      </dl>

      {item.alasan.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-caption text-bad">
          {item.alasan.map((alasan) => (
            <li key={alasan} className="flex items-start gap-1.5">
              <CircleX aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {alasan}
            </li>
          ))}
        </ul>
      ) : null}

      {item.sertifikat_habis_sebelum_selesai.length > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-caption text-warn">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Sertifikat habis sebelum periode selesai: {item.sertifikat_habis_sebelum_selesai.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

export function KartuUsulanPenugasan({
  data,
}: {
  data: {
    status: "konfirmasi_diperlukan";
    project_id: string;
    vendor_id: string;
    proyek: string;
    vendor: string;
    tenaga: number;
    mulai: string;
    selesai: string;
    nilai: number | null;
  };
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProposal() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/assignment/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: data.project_id,
          vendor_id: data.vendor_id,
          tenaga: data.tenaga,
          mulai: data.mulai,
          selesai: data.selesai,
          nilai: data.nilai,
        }),
      });
      const result = (await response.json().catch(() => null)) as { pesan?: string } | null;
      if (!response.ok) {
        setError(result?.pesan ?? "Usulan belum dibuat. Silakan coba lagi.");
        return;
      }
      setSubmitted(true);
      setConfirmOpen(false);
      toast.success("Usulan penugasan dibuat. Menunggu persetujuan Kepala Dinas.");
    } catch {
      setError("Usulan belum dibuat. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      role={submitted ? "status" : undefined}
      className={`rounded-md border bg-surface p-4 ${submitted ? "border-ok" : "border-warn"}`}
    >
      {submitted ? (
        <p className="flex items-center gap-2 text-table font-semibold text-ok">
          <CircleCheck aria-hidden className="size-4" />
          Usulan penugasan dibuat dan menunggu persetujuan Kepala Dinas
        </p>
      ) : (
        <>
          <p className="text-table font-semibold text-navy">Tinjau usulan penugasan</p>
          <p className="mt-1 text-caption text-muted">Usulan belum dibuat. Periksa rincian, lalu konfirmasi untuk mengirimnya.</p>
        </>
      )}
      <dl className="mt-3 grid gap-2 text-table sm:grid-cols-2">
        <div>
          <dt className="text-caption text-muted">Proyek</dt>
          <dd>{data.proyek}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Vendor</dt>
          <dd>{data.vendor}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Tenaga</dt>
          <dd className="tabular-nums">{data.tenaga}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Periode</dt>
          <dd>{formatTanggal(data.mulai)} sampai {formatTanggal(data.selesai)}</dd>
        </div>
        {data.nilai !== null ? (
          <div className="sm:col-span-2">
            <dt className="text-caption text-muted">Nilai</dt>
            <dd className="tabular-nums">{formatRupiah(data.nilai)}</dd>
          </div>
        ) : null}
      </dl>
      {submitted ? (
        <Link href={`/proyek/${data.project_id}`} className={`${actionLink} mt-3`}>
          Lihat proyek
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-table font-medium text-surface hover:bg-navy"
        >
          Konfirmasi dan ajukan usulan
        </button>
      )}
      <ConfirmationDialog
        open={confirmOpen}
        title="Buat usulan penugasan?"
        description="Usulan akan masuk ke antrean persetujuan Kepala Dinas. Penugasan belum aktif sampai disetujui."
        confirmLabel="Ajukan usulan"
        pending={pending}
        error={error}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void createProposal()}
      />
    </article>
  );
}
