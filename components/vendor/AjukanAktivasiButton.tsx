"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";

/** Admin asks the Kepala Dinas to activate a vendor that is in verification. */
export function AjukanAktivasiButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/aktivasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: id }),
      });
      const result = (await response.json().catch(() => null)) as { pesan?: string } | null;
      if (!response.ok) {
        setError(result?.pesan ?? "Usulan aktivasi belum dibuat. Silakan coba lagi.");
        return;
      }
      setOpen(false);
      toast.success("Usulan aktivasi dibuat. Menunggu persetujuan Kepala Dinas.");
      router.refresh();
    } catch {
      setError("Usulan aktivasi belum dibuat. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 text-table font-medium text-surface transition-colors hover:bg-navy"
      >
        <ShieldCheck aria-hidden className="size-4" />
        Ajukan aktivasi
      </button>
      <ConfirmationDialog
        open={open}
        title="Ajukan aktivasi vendor?"
        description={`Usulan aktivasi ${name} akan dikirim ke Kepala Dinas. Vendor baru aktif dan ikut dihitung sebagai kandidat setelah disetujui.`}
        confirmLabel="Ajukan aktivasi"
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={() => void request()}
      />
    </>
  );
}
