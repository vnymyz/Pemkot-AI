"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import type { Paged } from "@/lib/pagination";
import { Spinner } from "@/components/ui/spinner";

type Query = Record<string, string | string[] | undefined>;

const cell = "inline-flex size-11 items-center justify-center rounded-md border text-table tabular-nums";

function pageList(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
}

function PaginationLinkContent({
  children,
  loadingLabel,
}: {
  children: ReactNode;
  loadingLabel: string;
}) {
  const { pending } = useLinkStatus();
  return pending ? (
    <>
      <Spinner />
      <span role="status" className="sr-only">{loadingLabel}</span>
    </>
  ) : children;
}

/** Table footer with the row range and page links. Other query values are kept. */
export function Pagination({
  paged,
  path,
  query,
  param = "hal",
  label = "data",
}: {
  paged: Paged<unknown>;
  path: string;
  query: Query;
  param?: string;
  label?: string;
}) {
  const href = (page: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== param && typeof value === "string" && value) search.set(key, value);
    }
    if (page > 1) search.set(param, String(page));
    const text = search.toString();
    return text ? `${path}?${text}` : path;
  };

  const pages = pageList(paged.page, paged.totalPages);
  const previous = paged.page > 1;
  const next = paged.page < paged.totalPages;

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-3 py-2">
      <p className="text-caption text-muted tabular-nums">
        Menampilkan {paged.start} sampai {paged.end} dari {paged.total} {label}
      </p>
      {paged.totalPages > 1 ? (
        <nav aria-label={`Halaman ${label}`} className="flex flex-wrap items-center gap-1">
          {previous ? (
            <Link href={href(paged.page - 1)} scroll={false} aria-label="Halaman sebelumnya" className={`${cell} border-line text-primary hover:bg-primary-soft`}>
              <PaginationLinkContent loadingLabel="Memuat halaman sebelumnya">
                <ChevronLeft aria-hidden className="size-4" />
              </PaginationLinkContent>
            </Link>
          ) : (
            <span aria-disabled="true" className={`${cell} cursor-not-allowed border-line text-muted`}>
              <ChevronLeft aria-hidden className="size-4" />
            </span>
          )}
          {pages.map((item, index) => (
            <span key={item} className="flex items-center gap-1">
              {index > 0 && item - pages[index - 1] > 1 ? <span aria-hidden className="px-1 text-muted">...</span> : null}
              <Link
                href={href(item)}
                scroll={false}
                aria-label={`Halaman ${item}`}
                aria-current={item === paged.page ? "page" : undefined}
                className={`${cell} ${item === paged.page ? "border-primary bg-primary font-semibold text-surface" : "border-line text-primary hover:bg-primary-soft"}`}
              >
                <PaginationLinkContent loadingLabel={`Memuat halaman ${item}`}>
                  {item}
                </PaginationLinkContent>
              </Link>
            </span>
          ))}
          {next ? (
            <Link href={href(paged.page + 1)} scroll={false} aria-label="Halaman berikutnya" className={`${cell} border-line text-primary hover:bg-primary-soft`}>
              <PaginationLinkContent loadingLabel="Memuat halaman berikutnya">
                <ChevronRight aria-hidden className="size-4" />
              </PaginationLinkContent>
            </Link>
          ) : (
            <span aria-disabled="true" className={`${cell} cursor-not-allowed border-line text-muted`}>
              <ChevronRight aria-hidden className="size-4" />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
