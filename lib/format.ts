const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatRupiah(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "Tidak ada data";
  return `Rp ${number.format(Number(value))}`;
}

export function formatRentangHarga(min: number | null, max: number | null) {
  if (min === null && max === null) return "Tidak ada data";
  if (min === null || max === null || min === max) return formatRupiah(min ?? max);
  return `${formatRupiah(min)} - ${formatRupiah(max)}`;
}

/** Formats a database date (YYYY-MM-DD) as "23 Nov 2026". */
export function formatTanggal(value: string | null | undefined) {
  if (!value) return "Tidak ada data";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? "Tidak ada data" : date.format(parsed).replace(/\./g, "");
}

/** Today's date in Asia/Jakarta as YYYY-MM-DD. */
export function tanggalHariIni() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export const TIPE_LABEL: Record<string, string> = {
  barang: "Barang",
  jasa: "Jasa",
  barang_jasa: "Barang dan jasa",
};

/** Short Rupiah for charts: "Rp 9,4 miliar", "Rp 760 juta". */
export function formatRupiahRingkas(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "Tidak ada data";
  const short = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${short.format(n / 1_000_000_000)} miliar`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${short.format(n / 1_000_000)} juta`;
  return formatRupiah(n);
}
