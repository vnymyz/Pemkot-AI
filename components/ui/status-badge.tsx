import {
  Archive,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CircleX,
  Clock,
  FileText,
  Info,
  Search,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type Style = { label: string; icon: LucideIcon; className: string };

const base = "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-caption font-medium whitespace-nowrap";

const VENDOR: Record<string, Style> = {
  aktif: { label: "Aktif", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  verifikasi: { label: "Verifikasi", icon: FileText, className: "border-primary bg-primary-soft text-primary" },
  draft: { label: "Draft", icon: FileText, className: "border-primary bg-primary-soft text-primary" },
  ditolak: { label: "Ditolak", icon: CircleX, className: "border-bad bg-surface text-bad" },
  daftar_hitam: { label: "Daftar hitam", icon: CircleX, className: "border-bad bg-surface text-bad" },
  diarsipkan: { label: "Diarsipkan", icon: Archive, className: "border-line bg-surface text-muted" },
};

const CERT: Record<string, Style> = {
  berlaku: { label: "Berlaku", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  hampir_habis: { label: "Hampir habis", icon: TriangleAlert, className: "border-warn bg-surface text-warn" },
  kedaluwarsa: { label: "Kedaluwarsa", icon: TriangleAlert, className: "border-bad bg-surface text-bad" },
};

const PROJECT: Record<string, Style> = {
  rencana: { label: "Rencana", icon: FileText, className: "border-primary bg-primary-soft text-primary" },
  mencari_vendor: { label: "Mencari vendor", icon: Search, className: "border-warn bg-surface text-warn" },
  berjalan: { label: "Berjalan", icon: CirclePlay, className: "border-ok bg-surface text-ok" },
  selesai: { label: "Selesai", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  ditunda: { label: "Ditunda", icon: CirclePause, className: "border-warn bg-surface text-warn" },
  dibatalkan: { label: "Dibatalkan", icon: CircleX, className: "border-bad bg-surface text-bad" },
};

const ASSIGNMENT: Record<string, Style> = {
  diusulkan: { label: "Menunggu", icon: Clock, className: "border-warn bg-surface text-warn" },
  disetujui: { label: "Disetujui", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  berjalan: { label: "Berjalan", icon: CirclePlay, className: "border-ok bg-surface text-ok" },
  selesai: { label: "Selesai", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  dibatalkan: { label: "Dibatalkan", icon: CircleX, className: "border-bad bg-surface text-bad" },
};

/** One plain sentence per status, shown as a tooltip so a new person does not have to guess. */
const HINT: Record<string, string> = {
  Aktif: "Vendor sudah disetujui dan dapat diusulkan pada proyek.",
  Verifikasi: "Dokumen vendor sedang diperiksa Admin.",
  Draft: "Data vendor masih disusun dan belum dikirim.",
  Ditolak: "Usulan ditolak. Data dapat diperbaiki lalu dikirim ulang.",
  "Daftar hitam": "Vendor tidak dapat dipakai pada proyek.",
  Diarsipkan: "Vendor tidak lagi dipakai, riwayatnya tetap tersimpan.",
  Berlaku: "Sertifikat masih berlaku.",
  "Hampir habis": "Sertifikat berakhir dalam 60 hari.",
  Kedaluwarsa: "Sertifikat sudah lewat masa berlaku.",
  Rencana: "Proyek masih direncanakan.",
  "Mencari vendor": "Proyek menunggu vendor yang sesuai.",
  Berjalan: "Pekerjaan sedang berlangsung.",
  Selesai: "Pekerjaan sudah selesai.",
  Ditunda: "Proyek ditunda untuk sementara.",
  Dibatalkan: "Dibatalkan dan tidak dilanjutkan.",
  Menunggu: "Usulan menunggu keputusan Kepala Dinas.",
  Disetujui: "Kepala Dinas menyetujui. Vendor boleh mulai.",
  Ready: "Vendor memenuhi semua syarat wajib proyek ini.",
  "Tidak bisa": "Vendor tidak memenuhi satu atau lebih syarat wajib.",
  Lengkap: "Dokumen sesuai dengan data vendor.",
  "Tidak cocok": "Isi dokumen berbeda dari data vendor.",
  "Perlu diperiksa manual": "Admin perlu memeriksa dokumen ini sendiri.",
  "Belum diperiksa": "Dokumen belum diperiksa.",
  "Belum ada riwayat": "Vendor belum pernah mengerjakan proyek di sini, jadi belum ada penilaian.",
};

function Badge({ style }: { style: Style }) {
  const Icon = style.icon;
  return (
    <span title={HINT[style.label]} className={`${base} ${style.className}`}>
      <Icon aria-hidden className="size-3.5" />
      {style.label}
    </span>
  );
}

export function VendorStatusBadge({ status }: { status: string }) {
  return <Badge style={VENDOR[status] ?? { label: status, icon: Info, className: "border-line bg-surface text-muted" }} />;
}

export function CertStatusBadge({ status }: { status: string }) {
  return <Badge style={CERT[status] ?? { label: status, icon: Info, className: "border-line bg-surface text-muted" }} />;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return <Badge style={PROJECT[status] ?? { label: status, icon: Info, className: "border-line bg-surface text-muted" }} />;
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  return <Badge style={ASSIGNMENT[status] ?? { label: status, icon: Info, className: "border-line bg-surface text-muted" }} />;
}

export function ReadyBadge({ ready }: { ready: boolean }) {
  return (
    <Badge
      style={
        ready
          ? { label: "Ready", icon: CircleCheck, className: "border-ok bg-surface text-ok" }
          : { label: "Tidak bisa", icon: CircleX, className: "border-bad bg-surface text-bad" }
      }
    />
  );
}

const DOC: Record<string, Style> = {
  belum: { label: "Belum diperiksa", icon: Clock, className: "border-line bg-surface text-muted" },
  lengkap: { label: "Lengkap", icon: CircleCheck, className: "border-ok bg-surface text-ok" },
  tidak_cocok: { label: "Tidak cocok", icon: CircleX, className: "border-bad bg-surface text-bad" },
  perlu_diperiksa_manual: {
    label: "Perlu diperiksa manual",
    icon: TriangleAlert,
    className: "border-warn bg-surface text-warn",
  },
};

export function DocStatusBadge({ status }: { status: string }) {
  return <Badge style={DOC[status] ?? { label: status, icon: Info, className: "border-line bg-surface text-muted" }} />;
}

export function NoHistoryBadge() {
  return <Badge style={{ label: "Belum ada riwayat", icon: Info, className: "border-line bg-surface text-muted" }} />;
}
