"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_VISIBLE_MS = 15000;

export function ProgressBar() {
  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      className="no-print fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary-soft"
    >
      <div className="route-progress-bar h-full bg-gold" />
    </div>
  );
}

/** Shows the top bar from a link click until the new page's path is active. */
export function RouteProgress() {
  const pathname = usePathname();
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const active = startedFrom === pathname;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
        setStartedFrom(window.location.pathname);
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Safety net so a failed navigation cannot leave the bar on screen.
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setStartedFrom(null), MAX_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return active ? <ProgressBar /> : null;
}
