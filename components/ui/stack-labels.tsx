"use client";

import { useEffect, useRef } from "react";

/**
 * Put this right after a <table className="ledger">. On phones the table shows as small cards
 * (CSS in globals.css), and each card line needs its column name. The names are copied from the
 * header row after the table has hydrated, so the server HTML and the client HTML still match.
 */
export function StackLabels() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const table = marker.current?.parentElement?.querySelector<HTMLTableElement>("table.ledger");
    if (!table) return;

    function label() {
      if (!table) return;
      const names = [...table.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
      table.querySelectorAll("tbody tr").forEach((row) => {
        [...row.children].forEach((cell, index) => {
          const name = names[index] ?? "";
          if (cell.getAttribute("data-label") !== name) cell.setAttribute("data-label", name);
        });
      });
    }

    label();
    const observer = new MutationObserver(label);
    observer.observe(table, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <span ref={marker} hidden />;
}
