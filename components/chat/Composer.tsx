"use client";

import { SendHorizontal } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Spinner } from "@/components/ui/spinner";

export function Composer({
  value,
  onChange,
  onSend,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
}) {
  const disabled = busy || !value.trim();

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!disabled) onSend();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSend();
      }}
      className="shrink-0 border-t border-line bg-surface p-3"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Tulis pesan untuk Asisten Pemkot</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Tulis pertanyaan tentang vendor atau proyek"
            className="block max-h-36 min-h-11 w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-body text-text"
          />
        </label>
        <button
          type="submit"
          disabled={disabled}
          aria-label="Kirim pesan"
          title="Kirim pesan"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-surface transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {busy ? <Spinner /> : <SendHorizontal aria-hidden className="size-4" />}
        </button>
      </div>
    </form>
  );
}
