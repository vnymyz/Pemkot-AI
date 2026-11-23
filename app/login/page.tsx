import type { Metadata } from "next";
import { Brand } from "@/components/ui/brand";
import { quickLoginAllowed } from "@/lib/auth/quick-login";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk | Pemkot-AI" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="on-navy flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-navy px-4 py-3 md:px-6">
        <Brand />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-md border border-line bg-surface p-6 md:p-8">
          <h1 className="text-page font-semibold text-navy">Masuk</h1>
          <p className="mt-1 mb-6 text-table text-muted">
            Gunakan akun demo untuk mengelola vendor dan proyek.
          </p>
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
