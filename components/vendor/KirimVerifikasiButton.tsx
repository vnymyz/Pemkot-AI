"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";

/** Sends a complete draft vendor to verification. Disabled until the required documents are complete. */
export function KirimVerifikasiButton({
  id,
  name,
  missing,
}: {
  id: string;
  name: string;
  /** Required document types that are not complete yet. */
  missing: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = missing.length > 0;

  async function send() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: id }),
      });
      const result = (await response.json().catch(() => null)) as { pesan?: string } | null;
      if (!response.ok) {
        setError(result?.pesan ?? "Vendor belum terkirim untuk verifikasi. Silakan coba lagi.");
        return;
      }
      setOpen(false);
      toast.success("Terkirim. Admin akan memeriksa dokumen.");
      router.refresh();
    } catch {
      setError("Vendor belum terkirim untuk verifikasi. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={blocked}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        <Send aria-hidden className="size-4" />
        Kirim untuk verifikasi
      </button>
      {blocked ? (
        <p className="mt-2 text-caption text-muted">Dokumen wajib belum lengkap: {missing.join(", ")}.</p>
      ) : null}
      <ConfirmationDialog
        open={open}
        title="Kirim vendor untuk verifikasi?"
        description={`Data dan dokumen ${name} tidak dapat diubah lagi selama proses verifikasi. Admin Pengadaan kemudian dapat mengajukan aktivasi ke Kepala Dinas.`}
        confirmLabel="Kirim"
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={() => void send()}
      />
    </div>
  );
}
