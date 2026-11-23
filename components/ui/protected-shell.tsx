import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { requireSessionState } from "@/lib/auth/session";
import { AppShell } from "./app-shell";
import { Brand } from "./brand";
import { SignOutButton } from "./sign-out-button";

/** Page frame for every logged-in area. An account without a role sees a notice instead. */
export async function ProtectedShell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
  const state = await requireSessionState();

  if (state.status === "ready") {
    return (
      <AppShell session={state.session} fullHeight={fullHeight}>
        {children}
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="on-navy flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-navy px-4 py-2 md:px-6">
        <Brand />
        <SignOutButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div role="alert" className="w-full max-w-md rounded-md border border-warn bg-surface p-6">
          <h1 className="flex items-center gap-2 text-section font-semibold text-warn">
            <TriangleAlert aria-hidden className="size-5" />
            Akun belum memiliki peran
          </h1>
          <p className="mt-2 text-table">
            Login berhasil, tetapi profil akun ini belum ada di tabel profiles. Silakan hubungi pengelola demo.
          </p>
        </div>
      </main>
    </div>
  );
}
