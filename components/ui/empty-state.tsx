import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** A list with nothing to show. Says why, and offers one next step. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: { label: string; href: string };
  /** Kept so callers do not break. Empty states are text only. */
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <h2 className="text-card font-semibold text-navy">{title}</h2>
      {description ? <p className="mt-1 max-w-md text-table text-muted">{description}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
