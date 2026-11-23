import { LogIn } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="on-navy flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-navy px-4 py-3 md:px-6">
        <Brand />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10">
        <h1 className="text-page font-semibold text-navy">Asisten pengelolaan vendor dan proyek</h1>
        <p className="mt-3 text-muted">
          Demo untuk mencari vendor, memeriksa kesiapan vendor pada sebuah proyek, dan mengusulkan penugasan.
          Setiap penugasan menunggu persetujuan pejabat yang berwenang.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-5 font-medium text-surface transition-colors hover:bg-navy"
        >
          <LogIn aria-hidden className="size-4" />
          Masuk
        </Link>
      </main>
    </div>
  );
}
