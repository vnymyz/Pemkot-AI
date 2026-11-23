import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PanduanButton } from "@/components/onboarding/Onboarding";
import { TourButton } from "@/components/tour/Tour";
import { PageHeader } from "@/components/ui/page-header";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { getSessionState } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/format";
import { Analitik } from "@/components/dashboard/Analitik";
import { analitikDashboard, ringkasanDashboard, type DashboardData } from "@/lib/services/dashboard";

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
        title: "usulan menunggu keputusan Bapak/Ibu",
        detail: d.usulan_tertua ? `Yang paling lama masuk ${formatTanggal(d.usulan_tertua)}.` : "Semua sudah diputuskan.",
        href: "/persetujuan",
        cta: "Buka usulan",
        done: "Tidak ada usulan yang menunggu.",
      },
      {
        key: "proyek",
        count: n(d.proyek_tanpa_vendor),
        title: "proyek belum punya vendor",
        detail: "Masih mencari vendor.",
        href: "/proyek?status=mencari_vendor",
        cta: "Lihat proyek",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "sertifikat",
        count: n(d.sertifikat_hampir_habis),
        title: "sertifikat vendor hampir habis",
        detail: "Berakhir dalam 60 hari atau sudah lewat.",
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
        title: "vendor menunggu verifikasi",
        detail: "Periksa dokumen, lalu ajukan aktivasi ke Kepala Dinas.",
        href: "/vendor?status=verifikasi",
        cta: "Periksa vendor",
        done: "Tidak ada vendor yang menunggu verifikasi.",
      },
      {
        key: "proyek",
        count: n(d.proyek_tanpa_vendor),
        title: "proyek belum punya vendor",
        detail: "Cari vendor yang siap, lalu ajukan penugasan.",
        href: "/proyek?status=mencari_vendor",
        cta: "Cari vendor",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "usulan",
        count: n(d.usulan_menunggu),
        title: "usulan Bapak/Ibu menunggu keputusan",
        detail: "Menunggu keputusan Kepala Dinas.",
        href: "/penugasan?status=diusulkan",
        cta: "Lihat usulan",
        done: "Tidak ada usulan yang menunggu.",
      },
      {
        key: "sertifikat",
        count: n(d.sertifikat_hampir_habis),
        title: "sertifikat vendor hampir habis",
        detail: "Berakhir dalam 60 hari atau sudah lewat.",
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
        title: "proyek dinas Bapak/Ibu belum punya vendor",
        detail: "Lihat vendor yang siap, lalu ajukan penugasan.",
        href: "/proyek?status=mencari_vendor",
        cta: "Cari vendor",
        done: "Semua proyek sudah punya vendor.",
      },
      {
        key: "usulan",
        count: n(d.usulan_menunggu),
        title: "usulan Bapak/Ibu menunggu keputusan",
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
      title: "dokumen wajib belum lengkap",
      detail: `${n(d.dokumen_lengkap)} dari ${n(d.dokumen_wajib)} dokumen wajib sudah lengkap (NIB, NPWP, Akta).`,
      href: "/vendor",
      cta: "Lengkapi dokumen",
      done: "Semua dokumen wajib sudah lengkap.",
    },
    {
      key: "penugasan",
      count: n(d.penugasan_aktif),
      title: "penugasan berjalan",
      detail: "Pekerjaan yang sudah disetujui.",
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

  const [data, analitik] = await Promise.all([ringkasanDashboard(session), analitikDashboard(session)]);
  const cards = cardsFor(session.role, data);
  const waiting = cards.filter((card) => card.count > 0);
  const waitingFirst = cards.findIndex((card) => card.count > 0);
  const place = session.role === "vendor" ? session.vendorNama : session.opdNama;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Halo, ${session.nama}`}
        description={`${ROLE_LABELS[session.role]}${place ? `, ${place}` : ""}. ${
          session.role === "vendor" && data.vendor_status
            ? `Status vendor: ${VENDOR_STATUS_TEXT[data.vendor_status] ?? data.vendor_status}`
            : waiting.length
              ? `Ada ${waiting.length} hal yang perlu diurus.`
              : "Semua sudah beres."
        }`}
      />

      <section aria-labelledby="tugas">
        <h2 id="tugas" className="text-section font-semibold text-navy">Perlu diurus</h2>
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
          {cards.map((card, index) => (
            <li
              key={card.key}
              data-tour={index === 0 ? "tugas" : undefined}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-body">
                  <span className="font-semibold text-navy tabular-nums">{card.count}</span> {card.title}
                </p>
                <p className="text-table text-muted">{card.count > 0 ? card.detail : card.done}</p>
              </div>
              {card.count > 0 ? (
                <Link
                  href={card.href}
                  className={`inline-flex min-h-11 items-center rounded-md px-4 text-table font-medium transition-colors ${
                    index === waitingFirst ? "bg-primary text-surface hover:bg-navy" : "border border-line text-primary hover:bg-primary-soft"
                  }`}
                >
                  {card.cta}
                </Link>
              ) : (
                <CircleCheck aria-label="Beres" className="size-5 text-ok" />
              )}
            </li>
          ))}
        </ul>
      </section>

      <Analitik data={analitik} />

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
