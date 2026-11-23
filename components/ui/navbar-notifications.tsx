"use client";

import { Bell, CircleAlert, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ApprovalNotification } from "@/lib/services/notifications";

function notificationTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value)).replace(/\./g, "");
}

export function NavbarNotifications({ userId }: { userId: string }) {
  const [items, setItems] = useState<ApprovalNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("notifications_failed");
      const data = (await response.json()) as { notifications: ApprovalNotification[] };
      setItems(data.notifications);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setLastSeen(window.localStorage.getItem(`pemkot_notifications_seen_${userId}`));
    } catch {
      setLastSeen(null);
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh, userId]);

  const unread = lastSeen
    ? items.filter((item) => item.updated_at > lastSeen).length
    : items.length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const seen = new Date().toISOString();
      setLastSeen(seen);
      try {
        window.localStorage.setItem(`pemkot_notifications_seen_${userId}`, seen);
      } catch {
        // Notifications remain available if the browser blocks local storage.
      }
      void refresh();
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={unread ? `Notifikasi, ${unread} pembaruan belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        aria-controls="navbar-notifications"
        title="Notifikasi"
        onClick={toggle}
        className="relative inline-flex size-11 items-center justify-center rounded-md text-primary transition-colors hover:bg-surface"
      >
        <Bell aria-hidden className="size-5" />
        {unread ? (
          <span aria-hidden className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1 text-caption font-semibold leading-none text-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          id="navbar-notifications"
          aria-label="Notifikasi persetujuan"
          className="absolute right-0 top-full z-50 mt-1 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-line bg-surface shadow-lg"
        >
          <div className="flex min-h-11 items-center justify-between border-b border-line px-3">
            <h2 className="text-table font-semibold text-navy">Notifikasi persetujuan</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup notifikasi"
              className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-primary-soft"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          {loading ? (
            <p role="status" className="px-3 py-4 text-table text-muted">Memuat pembaruan...</p>
          ) : error ? (
            <div role="alert" className="flex items-start gap-2 px-3 py-4 text-table text-bad">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              Tidak dapat memuat notifikasi.
            </div>
          ) : items.length ? (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-3 hover:bg-primary-soft"
                  >
                    <span className="block text-table font-medium text-text">{item.title}</span>
                    <span className="mt-0.5 block text-caption text-muted">{item.detail}</span>
                    <time className="mt-1 block text-caption text-muted">{notificationTime(item.updated_at)} WIB</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-table text-muted">Belum ada pembaruan persetujuan.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
