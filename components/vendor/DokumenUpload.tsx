"use client";

import { CircleCheck, CircleX, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ProgressBar } from "@/components/ui/route-progress";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  DOKUMEN_ACCEPT,
  DOKUMEN_JENIS,
  DOKUMEN_LABEL,
  DOKUMEN_MAX_BYTES,
} from "@/lib/vendor-document-schema";

const field = "mt-1 block h-11 w-full rounded-md border border-line bg-surface px-3 text-table text-text";

/** Uploads one document. The server checks the file type, then the AI reads the document. */
export function DokumenUpload({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jenis, setJenis] = useState<string>(DOKUMEN_JENIS[0]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage({ ok: false, text: "Pilih file yang akan diunggah." });
      return;
    }
    if (file.size > DOKUMEN_MAX_BYTES) {
      setMessage({ ok: false, text: `Ukuran file maksimal ${DOKUMEN_MAX_BYTES / 1024 / 1024} MB.` });
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("vendor_id", vendorId);
      body.set("jenis", jenis);
      body.set("file", file);
      const response = await fetch("/api/vendor/dokumen", { method: "POST", body });
      const result = (await response.json().catch(() => null)) as { pesan?: string; catatan?: string } | null;
      if (!response.ok) {
        const text = result?.pesan ?? "Dokumen belum tersimpan. Silakan coba lagi.";
        setMessage({ ok: false, text });
        toast.error(text);
        return;
      }
      setMessage({ ok: true, text: result?.catatan ?? "Dokumen tersimpan." });
      toast.success("Dokumen terunggah dan sudah dicek.");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "Dokumen belum tersimpan. Periksa koneksi, lalu coba lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-4">
      {pending ? <ProgressBar /> : null}
      <h3 className="text-table font-semibold">Unggah dokumen</h3>
      <p className="mt-1 text-caption text-muted">
        PDF, PNG, atau JPEG, maksimal {DOKUMEN_MAX_BYTES / 1024 / 1024} MB. Gunakan dokumen fiktif. Mengunggah ulang
        jenis yang sama akan menggantikan file lama.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
        <label className="text-caption font-medium">
          Jenis dokumen
          <select value={jenis} onChange={(event) => setJenis(event.target.value)} className={field}>
            {DOKUMEN_JENIS.map((item) => (
              <option key={item} value={item}>
                {DOKUMEN_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-caption font-medium">
          File
          <input
            ref={fileRef}
            type="file"
            accept={DOKUMEN_ACCEPT}
            className={`${field} py-2 file:mr-3 file:rounded file:border-0 file:bg-primary-soft file:px-3 file:py-1 file:text-table file:font-medium file:text-primary`}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface hover:bg-navy disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {pending ? <Spinner /> : <Upload aria-hidden className="size-4" />}
          {pending ? "Memeriksa dokumen" : "Unggah dan periksa"}
        </button>
      </div>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-3 flex items-start gap-2 text-table ${message.ok ? "text-ok" : "text-bad"}`}
        >
          {message.ok ? (
            <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
