"use client";

import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export function NavbarClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <time
      aria-label={now ? `Tanggal dan waktu ${dateFormatter.format(now)} ${timeFormatter.format(now)} WIB` : "Memuat tanggal dan waktu"}
      className="shrink-0 text-right text-caption leading-tight text-navy"
    >
      <span className="block">{now ? dateFormatter.format(now).replace(/\./g, "") : "Memuat tanggal"}</span>
      <span className="block font-medium tabular-nums">{now ? `${timeFormatter.format(now)} WIB` : "Memuat waktu"}</span>
    </time>
  );
}
