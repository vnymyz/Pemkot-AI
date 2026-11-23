import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { CertStatusBadge, NoHistoryBadge, VendorStatusBadge } from "@/components/ui/status-badge";
import { formatRentangHarga, formatTanggal, TIPE_LABEL } from "@/lib/format";
import type { VendorDetail, VendorRingkas } from "@/lib/services/vendor-types";

const detailLink =
  "inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-table font-medium text-primary hover:bg-primary-soft";

export function KartuDaftarVendor({ data }: { data: { jumlah: number; vendor: VendorRingkas[] } }) {
  if (data.vendor.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface p-4 text-table text-muted">
        Belum ada vendor yang sesuai. Coba ubah kata kunci, kategori, atau wilayah.
      </p>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {data.vendor.map((vendor) => (
        <article key={vendor.id} className="flex flex-col rounded-md border border-line bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-card font-semibold text-navy">{vendor.nama}</h3>
            <VendorStatusBadge status={vendor.status} />
          </div>
          <p className="mt-1 text-caption text-muted">
            {vendor.kategori.join(", ")} · {vendor.wilayah}
          </p>
          <dl className="mt-3 grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-table">
            <div className="col-span-2">
              <dt className="text-caption text-muted">Kisaran harga semua layanan</dt>
              <dd>{formatRentangHarga(vendor.harga_min, vendor.harga_maks)}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted">Kapasitas</dt>
              <dd className="tabular-nums">{vendor.kapasitas_proyek} proyek, {vendor.total_tenaga} tenaga</dd>
            </div>
            <div>
              <dt className="text-caption text-muted">Sertifikat berlaku</dt>
              <dd>{vendor.sertifikat_berlaku.join(", ") || "Tidak ada"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-caption text-muted">Penilaian</dt>
              <dd>{vendor.rating === null ? <NoHistoryBadge /> : <span className="tabular-nums">{vendor.rating} dari 5</span>}</dd>
            </div>
          </dl>
          <div className="mt-3">
            <Link href={`/vendor/${vendor.id}`} className={detailLink}>Lihat detail vendor</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function KartuProfilVendor({ data }: { data: { vendor: VendorDetail; kandidat_lain?: string[] } }) {
  const { vendor } = data;
  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-card font-semibold text-navy">{vendor.nama}</h3>
          <p className="text-caption text-muted">
            {TIPE_LABEL[vendor.tipe] ?? vendor.tipe} · {vendor.wilayah} · <span className="font-mono">{vendor.npwp}</span>
          </p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </div>

      {vendor.peringatan.length > 0 ? (
        <div className="mt-3 rounded-md border border-warn p-2 text-table text-warn">
          {vendor.peringatan.map((item) => (
            <p key={item} className="flex items-start gap-2">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {item}
            </p>
          ))}
        </div>
      ) : null}

      <dl className="mt-3 grid gap-3 text-table sm:grid-cols-3">
        <div>
          <dt className="text-caption text-muted">Sisa proyek</dt>
          <dd className="tabular-nums">{vendor.beban.sisa_proyek} dari {vendor.kapasitas_proyek}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Sisa tenaga</dt>
          <dd className="tabular-nums">{vendor.beban.sisa_tenaga} dari {vendor.total_tenaga}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Penilaian</dt>
          <dd>
            {vendor.penilaian.jumlah === 0 ? <NoHistoryBadge /> : <span className="tabular-nums">{vendor.penilaian.rata_rata} dari 5</span>}
          </dd>
        </div>
      </dl>

      <h4 className="mt-4 text-table font-semibold">Katalog</h4>
      <ul className="mt-1 divide-y divide-line text-table">
        {vendor.layanan.map((item) => (
          <li key={item.id} className="flex flex-wrap justify-between gap-x-3 py-1.5">
            <span>{item.nama_layanan}</span>
            <span className="text-muted">
              {formatRentangHarga(item.harga_min, item.harga_maks)}{item.satuan ? ` per ${item.satuan}` : ""}
            </span>
          </li>
        ))}
      </ul>

      {vendor.sertifikat.length > 0 ? (
        <>
          <h4 className="mt-4 text-table font-semibold">Sertifikat</h4>
          <ul className="mt-1 divide-y divide-line text-table">
            {vendor.sertifikat.map((item) => (
              <li key={`${item.jenis}-${item.nomor}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span>{item.jenis}, sampai {formatTanggal(item.berlaku_sampai)}</span>
                <CertStatusBadge status={item.status_berlaku} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-3">
        <Link href={`/vendor/${vendor.id}`} className={detailLink}>Lihat detail vendor</Link>
      </div>
    </article>
  );
}
