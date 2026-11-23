import type { ReactNode } from "react";

/** Colors carry meaning, and every item also has a text label, so nothing relies on color alone. */
export const TONE = {
  primary: "bg-primary",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  muted: "bg-muted",
  navy: "bg-navy",
  gold: "bg-gold",
  line: "bg-line",
} as const;
export type Tone = keyof typeof TONE;

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const fmt = (value: number) => number.format(value);

/** A framed chart. The title says the finding, not just the topic. */
export function ChartCard({
  title,
  note,
  children,
  className = "",
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-surface p-5 ${className}`}>
      <h3 className="text-card font-semibold text-navy">{title}</h3>
      {note ? <p className="mt-0.5 text-caption text-muted">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function NoData({ text = "Belum ada data untuk ditampilkan." }: { text?: string }) {
  return <p className="py-6 text-table text-muted">{text}</p>;
}

/** One big number with a short label. Used in a row at the top. */
export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-table text-muted">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-8 font-semibold text-navy tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-caption text-muted">{hint}</p> : null}
    </div>
  );
}

export type BarRow = { label: string; value: number; display?: string; sub?: string; tone?: Tone };

/** Horizontal bars with the value written next to each one. */
export function BarList({ rows, max, tone = "primary" }: { rows: BarRow[]; max?: number; tone?: Tone }) {
  if (rows.length === 0) return <NoData />;
  const top = max ?? Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-table">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{row.display ?? fmt(row.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-primary-soft" role="presentation">
            <div
              className={`h-2 rounded-full ${TONE[row.tone ?? tone]}`}
              style={{ width: `${Math.max((row.value / top) * 100, row.value > 0 ? 2 : 0)}%` }}
            />
          </div>
          {row.sub ? <p className="mt-0.5 text-caption text-muted">{row.sub}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export type Segment = { label: string; value: number; tone: Tone };

/** One stacked bar plus a legend with counts and shares. */
export function Segments({ items }: { items: Segment[] }) {
  const shown = items.filter((item) => item.value > 0);
  const total = shown.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <NoData />;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-primary-soft" role="presentation">
        {shown.map((item) => (
          <div key={item.label} className={TONE[item.tone]} style={{ width: `${(item.value / total) * 100}%` }} title={`${item.label}: ${item.value}`} />
        ))}
      </div>
      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {shown.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-table">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ${TONE[item.tone]}`} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{item.value}</span>
              <span className="text-muted"> ({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const monthLabel = (value: string) => `${MONTHS[Number(value.slice(5, 7)) - 1] ?? value} ${value.slice(2, 4)}`;

export type Column = { label: string; value: number; display: string };

/** Vertical bars over time. The biggest value is written on top of its bar. */
export function Columns({ items, unit }: { items: Column[]; unit: string }) {
  if (items.length === 0 || items.every((item) => item.value === 0)) return <NoData />;
  const top = Math.max(...items.map((item) => item.value), 1);
  const peak = items.findIndex((item) => item.value === top);
  return (
    <figure>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`Grafik batang ${unit} per bulan`}>
        {items.map((item, index) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            {index === peak ? <span className="mb-1 whitespace-nowrap text-caption font-medium tabular-nums">{item.display}</span> : null}
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${Math.max((item.value / top) * 100, item.value > 0 ? 3 : 0)}%` }}
              title={`${item.label}: ${item.display}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 border-t border-line pt-1">
        {items.map((item) => (
          <span key={item.label} className="min-w-0 flex-1 truncate text-center text-caption text-muted">
            {item.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Small table for ranked lists. */
export function MiniTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  if (rows.length === 0) return <NoData />;
  return (
    <table className="w-full text-left text-table">
      <thead className="text-muted">
        <tr>
          {head.map((cell, index) => (
            <th key={cell} scope="col" className={`pb-2 font-medium ${index > 0 ? "text-right" : ""}`}>
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, index) => (
              <td key={index} className={`py-2 ${index > 0 ? "text-right tabular-nums" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
