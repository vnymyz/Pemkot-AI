import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/**
 * Top of every page. Answers: where am I (title), what is this (description),
 * what can I do (actions). Detail pages add a breadcrumb back to the list.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Crumb[];
}) {
  return (
    <header className="mb-8">
      {breadcrumb?.length ? (
        <nav aria-label="Jejak halaman" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-caption text-muted">
            {breadcrumb.map((item, index) => (
              <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight aria-hidden className="size-3.5" /> : null}
                {item.href ? (
                  <Link href={item.href} className="inline-flex min-h-6 items-center rounded px-1 text-primary hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="px-1 text-text">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[2rem] leading-10 font-semibold text-navy">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-body text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
