"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/auth/roles";
import { TOUR_EVENT } from "./events";
import { TOUR } from "./steps";

const ACTIVE_KEY = "pemkot_tour_active";
const PAD = 8;
const GAP = 12;
const MARGIN = 16;

type Box = { top: number; left: number; width: number; height: number };

function read(role: Role): number | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { role?: string; step?: number };
    return saved.role === role && typeof saved.step === "number" ? saved.step : null;
  } catch {
    return null;
  }
}

function save(role: Role, step: number | null) {
  try {
    if (step === null) sessionStorage.removeItem(ACTIVE_KEY);
    else sessionStorage.setItem(ACTIVE_KEY, JSON.stringify({ role, step }));
  } catch {
    // The tour still works on this page. It just cannot continue after a full reload.
  }
}

const same = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * Spotlight tour. It points at real parts of the page, one step at a time, and moves
 * between pages by itself. Progress is kept for the browser tab, so a page change does not end it.
 */
export function Tour({ role }: { role: Role }) {
  const steps = TOUR[role];
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [popHeight, setPopHeight] = useState(220);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const targetRef = useRef<Element | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (next: number | null) => {
      save(role, next);
      setStep(next);
      if (next === null) {
        targetRef.current = null;
        setBox(null);
      }
    },
    [role],
  );

  // Resume after a page change, and start when asked.
  useEffect(() => {
    setStep(read(role));
    const start = () => go(0);
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, [role, go]);

  // Go to the step's page, then wait for its target to appear.
  useEffect(() => {
    if (step === null) return;
    const current = steps[step];
    if (!current) {
      go(null);
      return;
    }
    const onPage = pathname === current.path || pathname.startsWith(`${current.path}/`);
    targetRef.current = null;
    setBox(null);
    if (!onPage) {
      router.push(current.path);
      return;
    }
    if (!current.target) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const found = current.target ? document.querySelector(current.target) : null;
      const visible = found && found.getBoundingClientRect().width > 0;
      if (found && visible) {
        window.clearInterval(timer);
        targetRef.current = found;
        found.scrollIntoView({ block: "center", behavior: "smooth" });
      } else if (tries > 40) {
        window.clearInterval(timer); // Not on screen. The card shows in the middle instead.
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [step, pathname, steps, router, go]);

  // Follow the target while the page scrolls or resizes.
  useEffect(() => {
    if (step === null) return;
    let frame = 0;
    function tick() {
      const el = targetRef.current;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        setBox((old) => (same(old, next) ? old : next));
      } else {
        setBox((old) => (old === null ? old : null));
      }
      const pop = popRef.current;
      if (pop) setPopHeight((old) => (old === pop.offsetHeight ? old : pop.offsetHeight));
      setViewport((old) => (old.w === window.innerWidth && old.h === window.innerHeight ? old : { w: window.innerWidth, h: window.innerHeight }));
      frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (step !== null) nextRef.current?.focus();
  }, [step, pathname]);

  useEffect(() => {
    if (step === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") go(null);
      else if (event.key === "ArrowRight") go((step as number) + 1 >= steps.length ? null : (step as number) + 1);
      else if (event.key === "ArrowLeft" && (step as number) > 0) go((step as number) - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, steps.length, go]);

  if (step === null || !steps[step]) return null;
  const current = steps[step];
  const last = step === steps.length - 1;
  const phone = viewport.w < 640;
  const width = Math.min(380, viewport.w - MARGIN * 2);

  let top = Math.max(MARGIN, viewport.h / 2 - popHeight / 2);
  let left = Math.max(MARGIN, viewport.w / 2 - width / 2);
  if (box && !phone) {
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - popHeight;
    left = Math.min(Math.max(MARGIN, box.left + box.width / 2 - width / 2), viewport.w - width - MARGIN);
    if (below + popHeight <= viewport.h - MARGIN) top = below;
    else if (above >= MARGIN) top = above;
    else {
      // The target is taller than the free space. Park the card in the bottom corner instead of on top of it.
      top = viewport.h - popHeight - MARGIN;
      left = viewport.w - width - MARGIN;
    }
  }
  const popStyle = phone
    ? { left: MARGIN, right: MARGIN, bottom: MARGIN }
    : { top, left, width };

  return (
    <>
      <div aria-hidden className="no-print fixed inset-0 z-[80]" />
      {box ? (
        <div
          aria-hidden
          className="no-print pointer-events-none fixed z-[81] rounded-xl transition-all duration-200"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 9999px rgb(11 37 69 / 0.55)",
            outline: "3px solid var(--color-gold)",
            outlineOffset: 2,
          }}
        />
      ) : (
        <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-[81] bg-navy/55" />
      )}
      <div
        ref={popRef}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        style={popStyle}
        className="no-print fixed z-[82] rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-overlay)] transition-[top,left] duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="rounded-full bg-primary-soft px-3 py-0.5 text-caption font-medium text-primary" aria-live="polite">
            Langkah {step + 1} dari {steps.length}
          </p>
          <button
            type="button"
            onClick={() => go(null)}
            aria-label="Tutup panduan"
            className="-m-2.5 inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-text"
          >
            <span aria-hidden className="text-card leading-none">×</span>
          </button>
        </div>
        <h2 id="tour-title" className="mt-2 text-card font-semibold text-navy">
          {current.title}
        </h2>
        <p id="tour-text" className="mt-1 text-table text-muted">
          {current.text}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => go(null)}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-table font-medium text-muted transition-colors hover:bg-primary-soft hover:text-text"
          >
            Lewati panduan
          </button>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-table font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                Kembali
              </button>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={() => go(last ? null : step + 1)}
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-table font-medium text-surface transition-colors hover:bg-navy"
            >
              {last ? "Selesai" : "Lanjut"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Starts the tour from anywhere. */
export function TourButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))} className={className}>
      {children}
    </button>
  );
}
