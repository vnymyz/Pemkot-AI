import type { ReactNode } from "react";
import { DocStatusBadge } from "@/components/ui/status-badge";
import { formatRupiahRingkas, formatTanggal } from "@/lib/format";
import { PRIORITAS_LABEL, PROJECT_STATUS_LABEL, ASSIGNMENT_STATUS_LABEL } from "@/lib/services/project-types";
import type { AnalitikData } from "@/lib/services/dashboard";
import { BarList, ChartCard, Columns, fmt, MiniTable, monthLabel, NoData, Segments, Stat, type Tone } from "@/components/charts/charts";

const VENDOR_LABEL: Record<string, string> = {
  aktif: "Aktif",
  verifikasi: "Verifikasi",
  draft: "Draft",
  ditolak: "Ditolak",
  daftar_hitam: "Daftar hitam",
  diarsipkan: "Diarsipkan",
};
const VENDOR_TONE: Record<string, Tone> = { aktif: "ok", verifikasi: "primary", draft: "muted", ditolak: "bad", daftar_hitam: "navy", diarsipkan: "line" };
const PROJECT_TONE: Record<string, Tone> = { rencana: "muted", mencari_vendor: "warn", berjalan: "primary", selesai: "ok", ditunda: "gold", dibatalkan: "bad" };
const ASSIGNMENT_TONE: Record<string, Tone> = { diusulkan: "warn", disetujui: "primary", berjalan: "primary", selesai: "ok", dibatalkan: "bad" };
const PRIORITY_TONE: Record<string, Tone> = { rendah: "muted", sedang: "primary", tinggi: "warn", "belum diisi": "line" };
const ORDER_PROJECT = ["rencana", "mencari_vendor", "berjalan", "selesai", "ditunda", "dibatalkan"];
const ORDER_ASSIGNMENT = ["diusulkan", "disetujui", "berjalan", "selesai", "dibatalkan"];
const ORDER_PRIORITY = ["tinggi", "sedang", "rendah", "belum diisi"];
const JENIS_LABEL: Record<string, string> = {
  project_assignment: "Penugasan vendor",
  vendor_activation: "Aktivasi vendor",
  vendor_update: "Perubahan data vendor",
  vendor_archive: "Arsip vendor",
};

const n = (value: number | null | undefined) => value ?? 0;
const byOrder = <T,>(items: T[], order: string[], key: (item: T) => string) =>
  [...items].sort((a, b) => order.indexOf(key(a)) - order.indexOf(key(b)));
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-section font-semibold text-navy">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">{children}</div>;
}

function MonthlyValue({ data }: { data: AnalitikData }) {
  const items = data.nilai_bulanan.map((item) => ({ label: monthLabel(item.bulan), value: item.nilai, display: formatRupiahRingkas(item.nilai) }));
  const peak = [...data.nilai_bulanan].sort((a, b) => b.nilai - a.nilai)[0];
  return (
    <ChartCard
      title={peak && peak.nilai > 0 ? `Nilai penugasan terbesar ada di ${monthLabel(peak.bulan)}` : "Nilai penugasan per bulan"}
      note="Menurut bulan mulai pekerjaan. Penugasan yang disetujui, berjalan, dan selesai."
    >
      <Columns items={items} unit="nilai penugasan" />
    </ChartCard>
  );
}

function ProjectStatus({ data }: { data: AnalitikData }) {
  const rows = byOrder(data.proyek_status ?? [], ORDER_PROJECT, (item) => item.status);
  const total = rows.reduce((sum, item) => sum + item.jumlah, 0);
  const searching = rows.find((item) => item.status === "mencari_vendor")?.jumlah ?? 0;
  return (
    <ChartCard title={total ? `${searching} dari ${total} proyek masih mencari vendor` : "Proyek menurut status"}>
      <Segments items={rows.map((item) => ({ label: PROJECT_STATUS_LABEL[item.status] ?? item.status, value: item.jumlah, tone: PROJECT_TONE[item.status] ?? "muted" }))} />
    </ChartCard>
  );
}

function Priority({ data }: { data: AnalitikData }) {
  const rows = byOrder(data.proyek_prioritas ?? [], ORDER_PRIORITY, (item) => item.prioritas);
  return (
    <ChartCard title="Proyek menurut prioritas">
      <Segments items={rows.map((item) => ({ label: PRIORITAS_LABEL[item.prioritas] ?? item.prioritas, value: item.jumlah, tone: PRIORITY_TONE[item.prioritas] ?? "muted" }))} />
    </ChartCard>
  );
}

function AssignmentStatus({ data }: { data: AnalitikData }) {
  const rows = byOrder(data.penugasan_status, ORDER_ASSIGNMENT, (item) => item.status);
  return (
    <ChartCard title="Penugasan menurut status" note="Dari usulan sampai selesai.">
      <BarList rows={rows.map((item) => ({ label: ASSIGNMENT_STATUS_LABEL[item.status] ?? item.status, value: item.jumlah, tone: ASSIGNMENT_TONE[item.status] ?? "primary" }))} />
    </ChartCard>
  );
}

function Decisions({ data, title }: { data: AnalitikData; title: string }) {
  const rows = data.keputusan ?? [];
  return (
    <ChartCard title={title}>
      <MiniTable
        head={["Jenis", "Menunggu", "Disetujui", "Ditolak"]}
        rows={rows.map((item) => [JENIS_LABEL[item.jenis] ?? item.jenis, item.menunggu, item.disetujui, item.ditolak])}
      />
    </ChartCard>
  );
}

function InternalView({ data, role }: { data: AnalitikData; role: string }) {
  const k = data.kpi;
  const wide = role === "admin_pengadaan" || role === "kepala_dinas";
  const budget = n(k.anggaran_total);
  const assigned = n(k.nilai_penugasan);
  const certs = data.sertifikat && !Array.isArray(data.sertifikat) ? data.sertifikat : null;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-section font-semibold text-navy">Ringkasan</h2>
        <StatRow>
          {wide ? <Stat label="Vendor aktif" value={fmt(n(k.vendor_aktif))} hint={`dari ${fmt(n(k.vendor_total))} vendor terdaftar`} /> : null}
          <Stat label="Proyek berjalan" value={fmt(n(k.proyek_berjalan))} hint={`dari ${fmt(n(k.proyek_total))} proyek`} />
          <Stat label="Total anggaran" value={formatRupiahRingkas(budget)} />
          <Stat label="Nilai penugasan" value={formatRupiahRingkas(assigned)} hint={budget ? `${percent(assigned, budget)}% dari anggaran` : undefined} />
          <Stat
            label="Rata-rata waktu keputusan"
            value={k.rata_hari_keputusan === null ? "Belum ada" : `${fmt(n(k.rata_hari_keputusan))} hari`}
            hint={k.usulan_ditolak_persen === null ? undefined : `${fmt(n(k.usulan_ditolak_persen))}% usulan ditolak`}
          />
        </StatRow>
      </section>

      <Group title="Proyek dan anggaran">
        <MonthlyValue data={data} />
        <ProjectStatus data={data} />
        {wide ? (
          <ChartCard title="Anggaran dan nilai penugasan per dinas" note="Batang menunjukkan anggaran. Keterangan di bawahnya menunjukkan yang sudah ditugaskan.">
            <BarList
              rows={(data.anggaran_opd ?? []).map((item) => ({
                label: item.opd,
                value: item.anggaran,
                display: formatRupiahRingkas(item.anggaran),
                sub: `Sudah ditugaskan ${formatRupiahRingkas(item.nilai)} (${percent(item.nilai, item.anggaran)}%)`,
              }))}
            />
          </ChartCard>
        ) : null}
        <AssignmentStatus data={data} />
        <Priority data={data} />
      </Group>

      {wide ? (
        <Group title="Vendor">
          <ChartCard title={`${n(k.vendor_aktif)} dari ${n(k.vendor_total)} vendor berstatus aktif`}>
            <Segments items={byOrder(data.vendor_status ?? [], ["aktif", "verifikasi", "draft", "ditolak", "daftar_hitam", "diarsipkan"], (item) => item.status).map((item) => ({ label: VENDOR_LABEL[item.status] ?? item.status, value: item.jumlah, tone: VENDOR_TONE[item.status] ?? "muted" }))} />
          </ChartCard>
          <ChartCard title="Vendor aktif per kategori" note="Kategori dengan vendor sedikit berisiko sulit dicarikan pengganti.">
            <BarList rows={(data.vendor_kategori ?? []).map((item) => ({ label: item.kategori, value: item.jumlah }))} />
          </ChartCard>
          <ChartCard title="Vendor aktif per wilayah">
            <BarList rows={(data.vendor_wilayah ?? []).map((item) => ({ label: item.wilayah, value: item.jumlah }))} />
          </ChartCard>
          <ChartCard title="Vendor yang bebannya paling berat" note="Proyek yang sedang dikerjakan dibanding kapasitas.">
            <BarList
              rows={(data.kapasitas ?? []).map((item) => {
                const share = percent(item.terpakai, item.kapasitas);
                return {
                  label: item.nama,
                  value: share,
                  display: `${item.terpakai} dari ${item.kapasitas} proyek`,
                  tone: share >= 100 ? ("bad" as Tone) : share >= 75 ? ("warn" as Tone) : ("primary" as Tone),
                };
              })}
              max={100}
            />
          </ChartCard>
          <ChartCard title="Vendor dengan penilaian terbaik" note="Dari penilaian proyek yang sudah selesai.">
            <MiniTable
              head={["Vendor", "Nilai", "Tepat waktu"]}
              rows={(data.vendor_terbaik ?? []).map((item) => [item.nama, `${fmt(item.rata)} dari 5 (${item.jumlah})`, `${item.tepat_waktu_persen}%`])}
            />
          </ChartCard>
          <ChartCard title={certs ? `${certs.kedaluwarsa + certs.hari_30} sertifikat sudah lewat atau habis dalam 30 hari` : "Sertifikat vendor"}>
            {certs ? (
              <div className="space-y-4">
                <Segments
                  items={[
                    { label: "Sudah lewat", value: certs.kedaluwarsa, tone: "bad" },
                    { label: "Habis dalam 30 hari", value: certs.hari_30, tone: "warn" },
                    { label: "31 sampai 60 hari", value: certs.hari_60, tone: "gold" },
                    { label: "61 sampai 90 hari", value: certs.hari_90, tone: "muted" },
                  ]}
                />
                <MiniTable
                  head={["Vendor", "Sertifikat", "Sisa"]}
                  rows={certs.daftar.map((item) => [item.vendor, item.jenis, item.sisa_hari < 0 ? `lewat ${-item.sisa_hari} hari` : `${item.sisa_hari} hari`])}
                />
              </div>
            ) : (
              <NoData />
            )}
          </ChartCard>
        </Group>
      ) : null}

      <Group title="Persetujuan">
        <Decisions data={data} title={role === "kepala_dinas" ? "Keputusan yang sudah diambil" : "Usulan Bapak/Ibu"} />
      </Group>
    </div>
  );
}

function VendorView({ data }: { data: AnalitikData }) {
  const k = data.kpi;
  const certs = Array.isArray(data.sertifikat) ? data.sertifikat : [];
  const rows = byOrder(data.penugasan_status, ORDER_ASSIGNMENT, (item) => item.status);
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-section font-semibold text-navy">Ringkasan</h2>
        <StatRow>
          <Stat label="Penilaian rata-rata" value={k.rating_rata === null ? "Belum ada" : `${fmt(n(k.rating_rata))} dari 5`} hint={`${n(k.jumlah_penilaian)} penilaian`} />
          <Stat label="Tepat waktu" value={k.tepat_waktu_persen === null ? "Belum ada" : `${n(k.tepat_waktu_persen)}%`} />
          <Stat label="Proyek berjalan" value={fmt(n(k.proyek_berjalan))} hint={`${fmt(n(k.proyek_selesai))} sudah selesai`} />
          <Stat label="Nilai pekerjaan" value={formatRupiahRingkas(n(k.nilai_total))} />
          <Stat label="Kapasitas" value={`${n(k.kapasitas_proyek)} proyek`} hint={`${n(k.total_tenaga)} tenaga`} />
        </StatRow>
      </section>

      <Group title="Pekerjaan Bapak/Ibu">
        <ChartCard title="Penugasan menurut status">
          <BarList rows={rows.map((item) => ({ label: ASSIGNMENT_STATUS_LABEL[item.status] ?? item.status, value: item.jumlah, tone: ASSIGNMENT_TONE[item.status] ?? "primary" }))} />
        </ChartCard>
        <MonthlyValue data={data} />
        <ChartCard title="Penilaian per proyek" note="Skor kualitas dari 1 sampai 5.">
          <BarList
            rows={(data.penilaian ?? []).map((item) => ({
              label: item.judul,
              value: item.skor,
              display: `${item.skor} dari 5`,
              sub: item.tepat_waktu ? "Selesai tepat waktu" : "Terlambat",
              tone: item.tepat_waktu ? ("primary" as Tone) : ("warn" as Tone),
            }))}
            max={5}
          />
        </ChartCard>
      </Group>

      <Group title="Kelengkapan">
        <ChartCard title="Dokumen pendaftaran">
          <MiniTable head={["Dokumen", "Status"]} rows={(data.dokumen ?? []).map((item) => [item.jenis, <DocStatusBadge key={item.jenis} status={item.status} />])} />
        </ChartCard>
        <ChartCard title="Masa berlaku sertifikat">
          <MiniTable
            head={["Sertifikat", "Berlaku sampai", "Sisa"]}
            rows={certs.map((item) => [item.jenis, formatTanggal(item.berlaku_sampai), item.sisa_hari < 0 ? `lewat ${-item.sisa_hari} hari` : `${item.sisa_hari} hari`])}
          />
        </ChartCard>
      </Group>
    </div>
  );
}

/** Charts under the checklist. What is shown depends on the role. */
export function Analitik({ data }: { data: AnalitikData }) {
  if (data.role === "vendor") return <VendorView data={data} />;
  return <InternalView data={data} role={data.role} />;
}
