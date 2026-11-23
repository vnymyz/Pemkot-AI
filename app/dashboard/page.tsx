import { ArrowRight, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PanduanButton } from "@/components/onboarding/Onboarding";
import { TourButton } from "@/components/tour/Tour";
import { PageHeader } from "@/components/ui/page-header";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { getSessionState } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/format";
import { ringkasanDashboard, type DashboardData } from "@/lib/services/dashboard";

export const metadata: Metadata = { title: "Dashboard | Pemkot-AI" };

type Card = {
  key: string;
  count: number;
  title: string;
  detail: string;
  href: string;
  cta: string;
  /** Shown instead of the button when the count is zero. */
  done: string;
};

const VENDOR_STATUS_TEXT: Record<string, string> = {
  draft: "Draft. Lengkapi data dan dokumen, lalu kirim untuk verifikasi.",
  verifikasi: "Verifikasi. Admin sedang memeriksa dokumen Bapak/Ibu.",
  aktif: "Aktif. Vendor dapat diusulkan pada proyek.",
  ditolak: "Ditolak. Perbaiki data, lalu kirim ulang.",
  diarsipkan: "Diarsipkan.",
  daftar_hitam: "Daftar hitam.",
};

function cardsFor(role: Role, d: DashboardData): Card[] {
  const n = (value: number | undefined) => value ?? 0;

  if (role === "kepala_dinas") {
    return [
      {
        key: "usulan",
        count: n(d.usulan_menunggu),
        title: "Usulan menunggu keputusan",
        detail: d.usulan_tertua ? `Usulan tertua masuk ${formatTanggal(d.usulan_tertua)}.` : "Semua usulan sudah diputuskan.",
        href: "/persetujuan",
        cta: "Tinjau usulan",
        done: "Tidak ada usulan yang menunggu.",
      },
      {
        key: "proyek",
        count: n(d.proyek_tanpa_vendor),
        title: "Proyek belum punya vendor",
        detail: "Proyek yang masih mencari vendor.",
        href: "/proyek?status=mencari_vendor",
        cta: "Lihat proyek",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "sertifikat",
        count: n(d.sertifikat_hampir_habis),
        title: "Sertifikat hampir habis",
        detail: "Sertifikat vendor aktif yang berakhir dalam 60 hari atau sudah lewat.",
        href: "/chat",
        cta: "Minta laporan",
        done: "Tidak ada sertifikat yang perlu diperhatikan.",
      },
    ];
  }

  if (role === "admin_pengadaan") {
    return [
      {
        key: "verifikasi",
        count: n(d.vendor_verifikasi),
        title: "Vendor menunggu verifikasi",
        detail: "Periksa dokumen, lalu ajukan aktivasi ke Kepala Dinas.",
        href: "/vendor?status=verifikasi",
        cta: "Periksa vendor",
        done: "Tidak ada vendor yang menunggu verifikasi.",
      },
      {
        key: "proyek",
        count: n(d.proyek_tanpa_vendor),
        title: "Proyek belum punya vendor",
        detail: "Cari vendor yang siap, lalu ajukan penugasan.",
        href: "/proyek?status=mencari_vendor",
        cta: "Cari vendor",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "usulan",
        count: n(d.usulan_menunggu),
        title: "Usulan Bapak/Ibu yang menunggu",
        detail: "Menunggu keputusan Kepala Dinas.",
        href: "/penugasan?status=diusulkan",
        cta: "Lihat usulan",
        done: "Tidak ada usulan yang menunggu.",
      },
      {
        key: "sertifikat",
        count: n(d.sertifikat_hampir_habis),
        title: "Sertifikat hampir habis",
        detail: "Sertifikat vendor aktif yang berakhir dalam 60 hari atau sudah lewat.",
        href: "/chat",
        cta: "Buat laporan",
        done: "Tidak ada sertifikat yang perlu diperhatikan.",
      },
    ];
  }

  if (role === "pic_proyek") {
    return [
      {
        key: "proyek",
        count: n(d.proyek_tanpa_vendor),
        title: "Proyek dinas Bapak/Ibu tanpa vendor",
        detail: "Lihat vendor yang siap, lalu ajukan penugasan.",
        href: "/proyek?status=mencari_vendor",
        cta: "Cari vendor",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "usulan",
        count: n(d.usulan_menunggu),
        title: "Usulan Bapak/Ibu yang menunggu",
        detail: "Menunggu keputusan Kepala Dinas.",
        href: "/penugasan?status=diusulkan",
        cta: "Lihat usulan",
        done: "Tidak ada usulan yang menunggu.",
      },
    ];
  }

  return [
    {
      key: "dokumen",
      count: Math.max(n(d.dokumen_wajib) - n(d.dokumen_lengkap), 0),
      title: "Dokumen wajib yang belum lengkap",
      detail: `${n(d.dokumen_lengkap)} dari ${n(d.dokumen_wajib)} dokumen wajib sudah lengkap (NIB, NPWP, Akta).`,
      href: "/vendor",
      cta: "Lengkapi dokumen",
      done: "Semua dokumen wajib sudah lengkap.",
    },
    {
      key: "penugasan",
      count: n(d.penugasan_aktif),
      title: "Penugasan yang berjalan",
      detail: "Pekerjaan yang sudah disetujui untuk vendor Bapak/Ibu.",
      href: "/penugasan",
      cta: "Lihat penugasan",
      done: "Belum ada penugasan yang berjalan.",
    },
  ];
}

export default async function DashboardPage() {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { session } = state;

  const data = await ringkasanDashboard(session);
  const cards = cardsFor(session.role, data);
  const waiting = cards.filter((card) => card.count > 0);
  const waitingFirst = cards.findIndex((card) => card.count > 0);
  const place = session.role === "vendor" ? session.vendorNama : session.opdNama;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Selamat datang, ${session.nama}`}
        description={`${ROLE_LABELS[session.role]}${place ? `, ${place}` : ""}. ${
          session.role === "vendor" && data.vendor_status
            ? `Status vendor: ${VENDOR_STATUS_TEXT[data.vendor_status] ?? data.vendor_status}`
            : waiting.length
              ? `Ada ${waiting.length} hal yang perlu Bapak/Ibu perhatikan.`
              : "Tidak ada yang perlu dilakukan sekarang."
        }`}
      />

      <section aria-labelledby="tugas">
        <h2 id="tugas" className="text-section font-semibold text-navy">Yang perlu Bapak/Ibu lakukan</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {cards.map((card, index) => (
            <li key={card.key} data-tour={index === 0 ? "tugas" : undefined} className="flex flex-col rounded-lg border border-line bg-surface p-5">
              <p className="text-table font-medium text-muted">{card.title}</p>
              <p className="mt-2 text-[2.25rem] leading-10 font-semibold text-navy tabular-nums">{card.count}</p>
              <p className="mt-2 flex-1 text-table text-muted">{card.detail}</p>
              {card.count > 0 ? (
                <Link
                  href={card.href}
                  className={`mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-4 text-table font-medium transition-colors ${
                    index === waitingFirst ? "bg-primary text-surface hover:bg-navy" : "border border-line text-primary hover:bg-primary-soft"
                  }`}
                >
                  {card.cta}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              ) : (
                <p className="mt-4 inline-flex min-h-11 items-center gap-2 text-table font-medium text-ok">
                  <CircleCheck aria-hidden className="size-4" />
                  {card.done}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-card font-semibold text-navy">Butuh bantuan?</h2>
        <p className="mt-1 text-table text-muted">
          Tanyakan apa saja tentang vendor dan proyek kepada Asisten AI, atau minta dibuatkan file Word, Excel, dan PowerPoint.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/chat"
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-table font-medium text-primary transition-colors hover:bg-primary-soft"
          >
            Buka Asisten AI
          </Link>
          <TourButton className="inline-flex min-h-11 items-center rounded-md px-4 text-table font-medium text-primary transition-colors hover:bg-primary-soft">
            Mulai panduan interaktif
          </TourButton>
          <PanduanButton className="inline-flex min-h-11 items-center rounded-md px-4 text-table font-medium text-primary transition-colors hover:bg-primary-soft">
            Lihat pengantar singkat
          </PanduanButton>
        </div>
      </section>

    </div>
  );
}
