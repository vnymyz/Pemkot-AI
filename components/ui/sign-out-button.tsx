"use client";

import { LogOut } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/login/actions";
import { ConfirmationDialog } from "./confirmation-dialog";
import { ProgressBar } from "./route-progress";
import { Spinner } from "./spinner";

const TONE = {
  dark: "border-surface/40 text-surface hover:border-bad hover:bg-bad",
  light: "border-line text-primary hover:border-bad hover:bg-bad hover:text-surface",
};

function SubmitButton({ fullWidth, compact, tone }: { fullWidth: boolean; compact: boolean; tone: keyof typeof TONE }) {
  const { pending } = useFormStatus();
  const label = pending ? "Memproses" : "Keluar";
  return (
    <>
      {pending ? <ProgressBar /> : null}
      <button
        type="submit"
        disabled={pending}
        title={compact ? label : undefined}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-table font-medium transition-colors disabled:cursor-not-allowed ${TONE[tone]} ${fullWidth ? "w-full" : ""} ${compact ? "md:px-0" : ""}`}
      >
        {pending ? <Spinner /> : <LogOut aria-hidden className="size-4" />}
        <span className={compact ? "md:sr-only" : ""}>{label}</span>
      </button>
    </>
  );
}

export function SignOutButton({
  fullWidth = false,
  compact = false,
  tone = "dark",
}: {
  fullWidth?: boolean;
  compact?: boolean;
  /** dark: on a navy background. light: on a white background. */
  tone?: keyof typeof TONE;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function interceptSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setConfirmOpen(true);
  }

  return (
    <>
      <form ref={formRef} action={signOut} onSubmit={interceptSubmit}>
        <SubmitButton fullWidth={fullWidth} compact={compact} tone={tone} />
      </form>
      <ConfirmationDialog
        open={confirmOpen}
        title="Keluar dari akun?"
        description="Bapak/Ibu yakin ingin keluar dari Pemkot-AI?"
        confirmLabel="Keluar"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirmedRef.current = true;
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
