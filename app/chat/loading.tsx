import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-4 p-6">
      <span className="sr-only">Memuat halaman</span>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-16 w-3/4 max-w-xl" />
      <Skeleton className="h-16 w-2/3 max-w-lg self-end" />
    </div>
  );
}
