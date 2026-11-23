"use client";

import { CircleCheck, CircleX, Info, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Kind = "success" | "error" | "info";
type Item = { id: number; kind: Kind; text: string };

const MAX_VISIBLE = 3;
const DURATION: Record<Kind, number> = { success: 5000, info: 5000, error: 8000 };

let items: Item[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(kind: Kind, text: string) {
  items = [...items, { id: nextId++, kind, text }].slice(-MAX_VISIBLE);
  emit();
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

/** Call from any client component. The text uses the same verb as the button that was pressed. */
export const toast = {
  success: (text: string) => push("success", text),
  error: (text: string) => push("error", text),
  info: (text: string) => push("info", text),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => items;
const NO_ITEMS: Item[] = [];
const getServerSnapshot = () => NO_ITEMS;

const STYLE: Record<Kind, { icon: LucideIcon; label: string; bar: string; text: string }> = {
  success: { icon: CircleCheck, label: "Berhasil", bar: "bg-ok", text: "text-ok" },
  error: { icon: CircleX, label: "Gagal", bar: "bg-bad", text: "text-bad" },
  info: { icon: Info, label: "Info", bar: "bg-primary", text: "text-primary" },
};

function ToastCard({ item }: { item: Item }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION[item.kind]);
  const startedAt = useRef(0);
  const style = STYLE[item.kind];
  const Icon = style.icon;

  // The timer stops while the pointer or keyboard focus is on the toast, then continues with the time left.
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => dismiss(item.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(remaining.current - (Date.now() - startedAt.current), 1000);
    };
  }, [paused, item.id]);

  return (
    <div
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast-enter pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border border-line bg-surface py-3 pr-1 pl-5 shadow-[var(--shadow-overlay)]"
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${style.text}`} />
      <p className="min-w-0 flex-1 text-table text-text">
        <span className={`font-semibold ${style.text}`}>{style.label}.</span> {item.text}
      </p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Tutup pemberitahuan"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-text"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** One region for the whole app. Placed once in the root layout. */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <div
      aria-label="Pemberitahuan"
      className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-stretch gap-2 p-4 sm:inset-x-auto sm:right-0 sm:w-[26rem]"
    >
      {list.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
