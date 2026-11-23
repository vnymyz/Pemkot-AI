"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Role } from "@/lib/auth/roles";

type Placement = "right" | "bottom" | "left" | "top";
/** `path` is the page the step lives on. The tour opens that page itself, so it can walk through a whole job. */
type Step = { path: string; target: string; title: string; text: string; placement?: Placement };

const NAV_CHAT: Step = { path: "/dashboard", target: "nav-chat", title: "Minta bantuan Asisten AI", text: "Tanyakan apa saja tentang vendor dan proyek, atau minta dibuatkan file Word, Excel, dan PowerPoint dari data yang ada." };
const NOTIF: Step = { path: "/dashboard", target: "notif", placement: "bottom", title: "Pantau pemberitahuan", text: "Keputusan atas usulan dan hal yang perlu perhatian muncul di sini." };
const PANDUAN: Step = { path: "/dashboard", target: "panduan", placement: "right", title: "Ulangi panduan kapan saja", text: "Tombol ini membuka kembali panduan langkah demi langkah ini." };

const STEPS: Record<Role, Step[]> = {
  admin_pengadaan: [
    { path: "/dashboard", target: "tugas", placement: "bottom", title: "Mulai dari dashboard", text: "Sebagai Admin Pengadaan, Bapak/Ibu menyiapkan vendor dan mengusulkan penugasan. Kartu ini menunjukkan apa yang perlu dikerjakan lebih dulu." },
    { path: "/vendor", target: "vendor-tambah", placement: "bottom", title: "Tambahkan vendor", text: "Daftarkan perusahaan baru. Isi datanya, lalu simpan sebagai draft." },
    { path: "/vendor", target: "vendor-filter", placement: "bottom", title: "Cari dan saring", text: "Cari berdasarkan nama atau layanan. Saring status Verifikasi untuk melihat vendor yang menunggu Bapak/Ibu." },
    { path: "/vendor", target: "vendor-tabel", title: "Periksa dokumen", text: "Buka satu vendor. Periksa NIB, NPWP, dan Akta, lalu ajukan aktivasi ke Kepala Dinas bila sudah lengkap." },
    { path: "/proyek", target: "proyek-tabel", title: "Pilih proyek", text: "Buka proyek yang masih mencari vendor, lalu pilih \"Lihat vendor yang siap\" untuk melihat peringkat dan alasan skornya." },
    { path: "/penugasan", target: "penugasan-tabel", title: "Ajukan dan pantau", text: "Usulan penugasan tampil di sini dengan status Menunggu. Keputusan akhir ada pada Kepala Dinas." },
    NAV_CHAT,
    NOTIF,
    PANDUAN,
  ],
  pic_proyek: [
    { path: "/dashboard", target: "tugas", placement: "bottom", title: "Mulai dari dashboard", text: "Sebagai PIC Proyek, Bapak/Ibu mencari vendor untuk proyek dinas sendiri. Kartu ini menunjukkan proyek yang masih butuh vendor." },
    { path: "/proyek", target: "proyek-filter", placement: "bottom", title: "Temukan proyek", text: "Cari proyek dinas Bapak/Ibu. Saring status \"Mencari vendor\" untuk yang paling mendesak." },
    { path: "/proyek", target: "proyek-tabel", title: "Lihat vendor yang siap", text: "Buka proyek, lalu pilih \"Lihat vendor yang siap\". Bandingkan skor dan alasan setiap vendor." },
    { path: "/penugasan", target: "penugasan-tabel", title: "Ajukan dan pantau", text: "Ajukan penugasan dari halaman vendor yang siap. Usulan tampil di sini sampai Kepala Dinas memutuskan." },
    NAV_CHAT,
    NOTIF,
    PANDUAN,
  ],
  kepala_dinas: [
    { path: "/dashboard", target: "tugas", placement: "bottom", title: "Mulai dari dashboard", text: "Sebagai Kepala Dinas, Bapak/Ibu memutuskan usulan. Kartu pertama menunjukkan usulan yang menunggu." },
    { path: "/persetujuan", target: "persetujuan-kartu", placement: "bottom", title: "Baca usulan", text: "Setiap usulan menampilkan pengusul, vendor, proyek, dan rinciannya." },
    { path: "/persetujuan", target: "persetujuan-keputusan", placement: "top", title: "Putuskan", text: "Tulis catatan bila perlu, lalu setujui atau tolak. Pengusul akan melihat hasilnya." },
    { path: "/penugasan", target: "penugasan-tabel", title: "Lihat hasilnya", text: "Penugasan yang disetujui muncul di sini dan mengurangi kapasitas vendor." },
    { path: "/berkas", target: "berkas-tabel", title: "Ambil berkas", text: "File PowerPoint atau Excel buatan Asisten AI untuk rapat dapat diunduh dari sini." },
    NAV_CHAT,
    NOTIF,
    PANDUAN,
  ],
  vendor: [
    { path: "/dashboard", target: "tugas", placement: "bottom", title: "Mulai dari dashboard", text: "Sebagai vendor, Bapak/Ibu melengkapi data perusahaan agar dapat diusulkan pada proyek. Kartu ini menunjukkan yang masih kurang." },
    { path: "/vendor", target: "vendor-stepper", placement: "bottom", title: "Lihat tahap Bapak/Ibu", text: "Vendor melewati tiga tahap: Draft, Verifikasi, lalu Aktif. Tahap sekarang ditandai di sini." },
    { path: "/vendor", target: "dokumen", title: "Unggah dokumen", text: "Unggah NIB, NPWP, dan Akta. Setiap dokumen diperiksa otomatis, lalu oleh Admin bila perlu." },
    { path: "/vendor", target: "vendor-kirim", title: "Kirim untuk verifikasi", text: "Setelah dokumen wajib lengkap, kirim vendor untuk diverifikasi Admin." },
    { path: "/penugasan", target: "penugasan-tabel", title: "Pantau penugasan", text: "Setelah aktif dan diusulkan, pekerjaan yang disetujui tampil di sini." },
    NAV_CHAT,
    PANDUAN,
  ],
};

export const ONBOARDING_EVENT = "pemkot:onboarding";
const keyFor = (role: Role) => `pemkot_tour_${role}`;
const PAD = 6;
const MARGIN = 14;
const EDGE = 8;
const WIDTH = 320;

const find = (target: string) => document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
const visible = (el: HTMLElement | null) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

type Layout = {
  box: { left: number; top: number; width: number; height: number };
  pop: { left: number; top: number };
  side: Placement | null;
  arrow: number;
};

function layoutFor(el: HTMLElement, preferred: Placement | undefined, height: number): Layout {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const box = { left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 };
  const width = Math.min(WIDTH, vw - EDGE * 2);
  const order: Placement[] = [preferred ?? "right", "right", "bottom", "left", "top"];
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (const side of order) {
    if (side === "right" && box.left + box.width + MARGIN + width <= vw - EDGE) {
      const top = clamp(centerY - height / 2, EDGE, vh - height - EDGE);
      return { box, pop: { left: box.left + box.width + MARGIN, top }, side, arrow: clamp(centerY - top, 20, height - 20) };
    }
    if (side === "bottom" && box.top + box.height + MARGIN + height <= vh - EDGE) {
      const left = clamp(centerX - width / 2, EDGE, vw - width - EDGE);
      return { box, pop: { left, top: box.top + box.height + MARGIN }, side, arrow: clamp(centerX - left, 20, width - 20) };
    }
    if (side === "left" && box.left - MARGIN - width >= EDGE) {
      const top = clamp(centerY - height / 2, EDGE, vh - height - EDGE);
      return { box, pop: { left: box.left - MARGIN - width, top }, side, arrow: clamp(centerY - top, 20, height - 20) };
    }
    if (side === "top" && box.top - MARGIN - height >= EDGE) {
      const left = clamp(centerX - width / 2, EDGE, vw - width - EDGE);
      return { box, pop: { left, top: box.top - MARGIN - height }, side, arrow: clamp(centerX - left, 20, width - 20) };
    }
  }
  // Nothing fits beside the target (a very large block), so the card sits at the bottom of the screen.
  return {
    box,
    pop: { left: clamp(centerX - width / 2, EDGE, vw - width - EDGE), top: vh - height - 16 },
    side: null,
    arrow: 0,
  };
}

/**
 * A spotlight tour. It dims the page, rings one real element at a time, and explains it in a small card.
 * It walks through the whole job of the role, page by page, and opens once per role in this browser.
 * "Panduan singkat" in the sidebar starts it again.
 */
export function Onboarding({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [height, setHeight] = useState(190);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const direction = useRef(1);
  const atKey = `pemkot_tour_at_${role}`;

  const finish = useCallback(() => {
    setSteps(null);
    setLayout(null);
    setReady(false);
    try {
      sessionStorage.removeItem(atKey);
      localStorage.setItem(keyFor(role), "1");
    } catch {
      // The tour may show again next time. Nothing is lost.
    }
  }, [role, atKey]);

  const start = useCallback(() => {
    direction.current = 1;
    setLayout(null);
    setReady(false);
    setIndex(0);
    setSteps(STEPS[role]);
  }, [role]);

  const go = useCallback((delta: 1 | -1) => {
    direction.current = delta;
    setIndex((value) => Math.max(0, value + delta));
  }, []);

  // The tour walks across pages, and each section has its own layout, so the position is kept for the session.
  useEffect(() => {
    let at: string | null = null;
    try {
      at = sessionStorage.getItem(atKey);
    } catch {
      at = null;
    }
    if (at === null) return;
    const saved = Number(at);
    if (Number.isInteger(saved) && saved >= 0 && saved < STEPS[role].length) {
      setIndex(saved);
      setSteps(STEPS[role]);
    }
  }, [role, atKey]);

  // First visit: start on the dashboard once the page has settled.
  useEffect(() => {
    if (pathname !== "/dashboard") return;
    let seen = true;
    let running = false;
    try {
      seen = localStorage.getItem(keyFor(role)) === "1";
      running = sessionStorage.getItem(atKey) !== null;
    } catch {
      seen = true; // Without storage the tour would repeat every time, so it stays closed.
    }
    if (seen || running) return;
    const timer = window.setTimeout(start, 700);
    return () => window.clearTimeout(timer);
  }, [pathname, role, atKey, start]);

  // "Panduan singkat" from anywhere.
  useEffect(() => {
    window.addEventListener(ONBOARDING_EVENT, start);
    return () => window.removeEventListener(ONBOARDING_EVENT, start);
  }, [start]);

  const step = steps?.[index];

  // Open the step's page, then wait for its element. A step whose element never shows up (for example,
  // no proposal waiting) is skipped in the direction the person was going.
  useEffect(() => {
    if (!steps || !step) return;
    try {
      sessionStorage.setItem(atKey, String(index));
    } catch {
      // Position is only lost when moving to another section.
    }
    setReady(false);
    if (!window.location.pathname.startsWith(step.path)) {
      setLayout(null);
      router.push(step.path);
    }

    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = find(step.target);
      if (window.location.pathname.startsWith(step.path) && visible(el)) {
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
        setReady(true);
        return;
      }
      tries += 1;
      if (tries > 30) {
        if (direction.current < 0 && index > 0) setIndex(index - 1);
        else if (index < steps.length - 1) setIndex(index + 1);
        else finish();
        return;
      }
      timer = window.setTimeout(attempt, 100);
    };
    timer = window.setTimeout(attempt, 120);
    return () => window.clearTimeout(timer);
  }, [steps, step, index, atKey, router, finish]);

  // Place the ring and the card. Runs again when the window changes size or scrolls.
  useLayoutEffect(() => {
    if (!step || !ready) return;
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = find(step.target);
        if (current) setLayout(layoutFor(current, step.placement, cardRef.current?.offsetHeight ?? height));
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [step, ready, height]);

  useEffect(() => {
    if (!step || !layout || !cardRef.current) return;
    const measured = cardRef.current.offsetHeight;
    if (measured && Math.abs(measured - height) > 2) setHeight(measured);
    nextRef.current?.focus({ preventScroll: true });
  }, [step, layout, height]);

  useEffect(() => {
    if (!steps) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps, finish, go]);

  if (!steps || !step) return null;
  // Between pages the screen stays dimmed, so the tour does not flash away and back.
  if (!layout) return <div aria-hidden className="no-print fixed inset-0 z-[80] bg-navy/55" />;
  const last = index === steps.length - 1;
  const { box, pop, side, arrow } = layout;
  const arrowStyle =
    side === "right"
      ? { left: -6, top: arrow - 6 }
      : side === "left"
        ? { right: -6, top: arrow - 6 }
        : side === "bottom"
          ? { top: -6, left: arrow - 6 }
          : side === "top"
            ? { bottom: -6, left: arrow - 6 }
            : null;

  return (
    <div className="no-print fixed inset-0 z-[80]">
      {/* Blocks clicks on the page while the tour is open. */}
      <div aria-hidden className="absolute inset-0" />
      <div
        aria-hidden
        className="tour-ring pointer-events-none absolute rounded-xl"
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className="tour-card absolute rounded-xl border border-line bg-surface p-4 text-text shadow-[var(--shadow-overlay)]"
        style={{ left: pop.left, top: pop.top, width: Math.min(WIDTH, window.innerWidth - EDGE * 2) }}
      >
        {arrowStyle ? (
          <span aria-hidden className="absolute size-3 rotate-45 border border-line bg-surface" style={{ ...arrowStyle, borderWidth: side === "right" ? "0 0 1px 1px" : side === "left" ? "1px 1px 0 0" : side === "bottom" ? "1px 0 0 1px" : "0 1px 1px 0" }} />
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-caption font-medium text-primary tabular-nums">
            {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label="Tutup panduan"
            className="-m-2 inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-text"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mt-1 text-card font-semibold text-navy">
          {step.title}
        </h2>
        <p id="tour-text" className="mt-1 text-table text-muted">
          {step.text}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-table font-medium text-muted transition-colors hover:text-text"
          >
            Lewati panduan
          </button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-table font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                Kembali
              </button>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? finish() : go(1))}
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy"
            >
              {last ? "Selesai" : "Lanjut"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Starts the tour from anywhere. */
export function PanduanButton({
  className,
  children,
  tour,
}: {
  className?: string;
  children: React.ReactNode;
  tour?: string;
}) {
  return (
    <button type="button" data-tour={tour} onClick={() => window.dispatchEvent(new Event(ONBOARDING_EVENT))} className={className}>
      {children}
    </button>
  );
}
