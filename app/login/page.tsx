import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Brand } from "@/components/ui/brand";
import { quickLoginAllowed } from "@/lib/auth/quick-login";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk | Pemkot-AI" };

const POINTS = [
  "Cari vendor dan lihat kesiapannya untuk sebuah proyek.",
  "Ajukan penugasan. Keputusan akhir ada pada Kepala Dinas.",
  "Buat file Word, Excel, dan PowerPoint dari data yang ada.",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-navy px-6 py-8 text-surface md:px-12 lg:py-12">
        <Image
          src="/images/kantor-walikota-bekasi.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover object-[50%_30%]"
        />
        {/* Navy wash keeps the text readable on any photo. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy/90" />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-[2rem] leading-10 font-semibold">Kelola vendor dan proyek dalam satu tempat.</h1>
          <p className="mt-3 text-body text-surface/90">Asisten AI membantu menjawab, menyusun rekomendasi, dan menyiapkan berkas.</p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-table">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative space-y-1 text-caption text-surface/85">
          <p>Versi demo. Seluruh data bersifat fiktif.</p>
          <p>
            Foto: Kantor Walikota Bekasi oleh alhafis,{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Kantor_Walikota_Bekasi_-_panoramio.jpg"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-surface"
            >
              Wikimedia Commons
            </a>
            , lisensi{" "}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-surface"
            >
              CC BY 3.0
            </a>
            .
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 md:px-12">
        <div className="w-full max-w-md">
          <h2 className="text-section font-semibold text-navy">Masuk ke akun</h2>
          <p className="mt-1 mb-6 text-table text-muted">Gunakan email dan kata sandi akun demo Bapak/Ibu.</p>
          <LoginForm
            next={typeof next === "string" ? next : undefined}
            quickLoginVisible={quickLoginAllowed()}
            quickLoginEnabled={Boolean(process.env.DEMO_QUICK_LOGIN_PASSWORD)}
          />
        </div>
      </main>
    </div>
  );
}
