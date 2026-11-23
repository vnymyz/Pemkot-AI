/** A gray block that shimmers. Sized by the caller. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

/** Loading shape for a list page: title, subtitle, and a table with rows. The sidebar stays visible around it. */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="panel mt-4 overflow-hidden rounded-md border border-line bg-surface">
        <div className="flex gap-4 border-b border-line bg-primary-soft px-3 py-3">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-4 border-b border-line px-3 py-3 last:border-b-0">
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={index} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading shape for a detail or dashboard page: title and a grid of cards. */
export function CardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="panel rounded-md border border-line bg-surface p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
