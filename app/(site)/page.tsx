import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";

const FEATURES = [
  { title: "Cari vendor", text: "Temukan vendor yang cocok dengan kebutuhan proyek." },
  { title: "Periksa kesiapan", text: "Lihat skor dan alasan setiap vendor, dihitung dari data." },
  { title: "Ajukan penugasan", text: "Setiap usulan menunggu persetujuan pejabat yang berwenang." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Brand tone="light" />
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-md px-3 text-table font-medium text-primary hover:bg-primary-soft">
          Masuk
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        <h1 className="text-[2.5rem] leading-[3rem] font-semibold text-navy">Asisten pengelolaan vendor dan proyek.</h1>
        <p className="mt-4 max-w-xl text-body text-muted">
          Demo untuk mencari vendor, memeriksa kesiapannya pada sebuah proyek, dan mengusulkan penugasan.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-md bg-primary px-6 font-medium text-surface transition-colors hover:bg-navy"
        >
          Masuk
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <dl className="mt-14 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
          {FEATURES.map((item) => (
            <div key={item.title}>
              <dt className="text-card font-semibold text-navy">{item.title}</dt>
              <dd className="mt-1 text-table text-muted">{item.text}</dd>
            </div>
          ))}
        </dl>
      </main>
      <footer className="px-6 py-5 text-caption text-muted md:px-12">Versi demo. Seluruh data bersifat fiktif.</footer>
    </div>
  );
}
