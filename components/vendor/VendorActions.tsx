"use client";

import { Archive, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function VendorActions({
  id,
  name,
  status,
  hasPendingProposal,
}: {
  id: string;
  name: string;
  status: string;
  hasPendingProposal: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEdit = status === "draft" || status === "aktif";
  const waiting = hasPendingProposal || requested;

  async function requestArchive() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: id }),
      });
      const result = (await response.json().catch(() => null)) as { pesan?: string } | null;
      if (!response.ok) {
        setError(result?.pesan ?? "Usulan arsip belum dibuat. Silakan coba lagi.");
        return;
      }
      setRequested(true);
      setDialogOpen(false);
      router.refresh();
    } catch {
      setError("Usulan arsip belum dibuat. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (waiting) {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 text-caption font-medium text-warn">
        <Clock aria-hidden className="size-4" />
        Menunggu persetujuan
      </span>
    );
  }

  return (
    <div className="flex min-w-max flex-nowrap items-center gap-2">
      {canEdit ? (
        <Link
          href={`/vendor/${id}`}
          className="inline-flex min-h-11 min-w-24 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-line px-3 text-table font-medium text-primary hover:bg-primary-soft"
        >
          <Pencil aria-hidden className="size-4" />
          Edit
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center px-3 text-caption text-muted">Tidak dapat diedit</span>
      )}
      {status !== "diarsipkan" ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
          className="inline-flex min-h-11 min-w-32 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-bad px-3 text-table font-medium text-bad hover:bg-surface"
        >
          <Archive aria-hidden className="size-4" />
          Arsipkan
        </button>
      ) : null}
      <ConfirmationDialog
        open={dialogOpen}
        title="Ajukan pengarsipan vendor?"
        description={`Jika disetujui Kepala Dinas, ${name} akan disembunyikan dari pencarian. Riwayat dan penugasan lama tetap disimpan.`}
        confirmLabel="Ajukan arsip"
        danger
        pending={pending}
        error={error}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => void requestArchive()}
      />
    </div>
  );
}
