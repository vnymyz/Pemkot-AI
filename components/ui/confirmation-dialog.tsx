"use client";

import { useEffect, useId, useRef } from "react";
import { Spinner } from "./spinner";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  danger = false,
  pending = false,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-line bg-surface p-0 text-text shadow-[var(--shadow-overlay)] backdrop:bg-navy/50"
    >
      <div className="p-5">
        <h2 id={`${id}-title`} className="text-card font-semibold text-navy">{title}</h2>
        <p id={`${id}-description`} className="mt-2 text-table text-muted">{description}</p>
        {error ? <p role="alert" className="mt-3 text-table text-bad">{error}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 text-table font-medium text-primary hover:bg-primary-soft disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-table font-medium text-surface transition-colors disabled:cursor-not-allowed ${
              danger ? "bg-bad hover:bg-bad/90" : "bg-primary hover:bg-navy"
            }`}
          >
            {pending ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
