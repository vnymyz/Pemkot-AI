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

function Badge({ style }: { style: Style }) {
  const Icon = style.icon;
  return (
    <span className={`${base} ${style.className}`}>
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

export function NoHistoryBadge() {
  return <Badge style={{ label: "Belum ada riwayat", icon: Info, className: "border-line bg-surface text-muted" }} />;
}
