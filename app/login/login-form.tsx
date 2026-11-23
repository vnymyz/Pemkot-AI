"use client";

import { CircleX, Eye, EyeOff, LogIn } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/route-progress";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { quickSignIn, signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };
const inputClass =
  "block h-11 w-full rounded-md border border-line bg-surface px-3 text-body text-text";

const QUICK_ROLES = [
  { role: "admin_pengadaan", label: "Admin Pengadaan", hint: "Kelola vendor, ajukan usulan" },
  { role: "pic_proyek", label: "PIC Proyek", hint: "Cari vendor untuk proyek" },
  { role: "kepala_dinas", label: "Kepala Dinas", hint: "Setujui atau tolak usulan" },
  { role: "vendor", label: "Vendor", hint: "Isi data dan dokumen" },
] as const;

export function LoginForm({
  next,
  quickLoginVisible,
  quickLoginEnabled,
}: {
  next?: string;
  quickLoginVisible: boolean;
  quickLoginEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, initialState);
  const [quickState, quickAction, quickPending] = useActionState(quickSignIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [quickRole, setQuickRole] = useState<string | null>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);
  useEffect(() => {
    if (quickState.error) toast.error(quickState.error);
  }, [quickState]);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        {pending ? <ProgressBar /> : null}
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {state.error ? (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-bad bg-surface p-3 text-table text-bad">
            <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="text-table font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="nama@contoh.test"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-table font-medium">
            Kata sandi
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-primary"
            >
              {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-surface transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {pending ? <Spinner /> : <LogIn aria-hidden className="size-4" />}
          Masuk
        </button>
      </form>

      {quickLoginVisible ? (
        <form action={quickAction} className="space-y-3 border-t border-line pt-4">
          {quickPending ? <ProgressBar /> : null}
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <fieldset disabled={quickPending || !quickLoginEnabled} aria-busy={quickPending} className="space-y-3">
            <legend className="text-table font-medium text-navy">Coba sebagai</legend>
            <p className="text-caption text-muted">Khusus demo. Pilih satu peran untuk mencoba.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_ROLES.map(({ role, label, hint }) => (
                <button
                  key={role}
                  type="submit"
                  name="role"
                  value={role}
                  onClick={() => setQuickRole(role)}
                  className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-table transition-colors hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:bg-bg disabled:text-muted"
                >
                  {quickPending && quickRole === role ? (
                    <>
                      <Spinner />
                      <span className="sr-only">Memproses </span>
                    </>
                  ) : null}
                  <span className="min-w-0">
                    <span className="block font-medium text-navy">{label}</span>
                    <span className="block text-caption text-muted">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          {!quickLoginEnabled ? (
            <p className="text-caption text-muted">
              Tombol ini belum aktif. Pengelola perlu mengatur kata sandi bersama akun demo di konfigurasi lokal.
            </p>
          ) : null}
          {quickState.error ? (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-bad bg-surface p-3 text-table text-bad">
              <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{quickState.error}</span>
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
