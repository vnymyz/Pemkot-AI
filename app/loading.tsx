import { ProgressBar } from "@/components/ui/route-progress";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <>
      <ProgressBar />
      <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-primary">
        <Spinner className="size-9" />
        <p className="text-table font-medium text-muted">Memuat halaman</p>
      </div>
    </>
  );
}
