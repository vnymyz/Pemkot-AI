import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getSessionState } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard | Pemkot-AI" };

export default async function DashboardPage() {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { session } = state;

  const rows: [string, string][] = [
    ["Nama", session.nama],
    ["Email", session.email],
    ["Peran", ROLE_LABELS[session.role]],
    ["Perangkat daerah", session.opdNama ?? "Belum terhubung"],
    ["Vendor", session.vendorNama ?? "Belum terhubung"],
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-page font-semibold text-navy">Dashboard</h1>
      <p className="mt-1 text-table text-muted">Selamat datang, Bapak/Ibu {session.nama}.</p>

      <section aria-labelledby="akun" className="mt-6 rounded-md border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 id="akun" className="text-card font-semibold">
            Informasi akun
          </h2>
          <span className="inline-flex items-center gap-1.5 text-caption font-medium text-ok">
            <CircleCheck aria-hidden className="size-4" />
            Sesi aktif
          </span>
        </div>
        <dl className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-4 py-3 text-table sm:grid-cols-3">
              <dt className="text-muted">{label}</dt>
              <dd className="break-words sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
