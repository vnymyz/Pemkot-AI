"use client";

import { Check, ExternalLink, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";

type Action = "hapus" | "lengkap" | "tidak_cocok";

const button =
  "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-table font-medium";

/** Actions for one uploaded document: open it, delete it, or let the admin settle the check by hand. */
export function DokumenRowActions({
  id,
  jenis,
  canDelete,
  canDecide,
}: {
  id: string;
  jenis: string;
  canDelete: boolean;
  canDecide: boolean;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!action) return;
    setPending(true);
    setError(null);
    try {
      const response =
        action === "hapus"
          ? await fetch(`/api/vendor/dokumen/${id}`, { method: "DELETE" })
          : await fetch(`/api/vendor/dokumen/${id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lengkap: action === "lengkap", catatan: "Diperiksa manual oleh Admin Pengadaan" }),
            });
      const result = (await response.json().catch(() => null)) as { pesan?: string } | null;
      if (!response.ok) {
        setError(result?.pesan ?? "Permintaan belum berhasil. Silakan coba lagi.");
        return;
      }
      toast.success(
        action === "hapus" ? "Dokumen dihapus." : action === "lengkap" ? "Dokumen ditandai lengkap." : "Dokumen ditandai tidak lengkap.",
      );
      setAction(null);
      router.refresh();
    } catch {
      setError("Permintaan belum berhasil. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  const copy: Record<Action, { title: string; description: string; label: string; danger: boolean }> = {
    hapus: {
      title: "Hapus dokumen?",
      description: `Dokumen ${jenis} akan dihapus permanen dan tidak dapat dikembalikan. Anda dapat mengunggah dokumen baru.`,
      label: "Hapus",
      danger: true,
    },
    lengkap: {
      title: "Tandai dokumen lengkap?",
      description: `Dokumen ${jenis} dianggap sudah diperiksa manual dan sesuai dengan data vendor.`,
      label: "Tandai lengkap",
      danger: false,
    },
    tidak_cocok: {
      title: "Tandai dokumen tidak cocok?",
      description: `Dokumen ${jenis} dianggap tidak sesuai. Vendor perlu mengunggah dokumen yang benar.`,
      label: "Tandai tidak cocok",
      danger: true,
    },
  };
  const current = action ? copy[action] : null;

  return (
    <div className="flex min-w-max flex-wrap items-center gap-2">
      <a
        href={`/api/vendor/dokumen/${id}`}
        target="_blank"
        rel="noreferrer"
        className={`${button} border-line text-primary hover:bg-primary-soft`}
      >
        <ExternalLink aria-hidden className="size-4" />
        Lihat
      </a>
      {canDecide ? (
        <>
          <button type="button" onClick={() => setAction("lengkap")} className={`${button} border-ok text-ok hover:bg-surface`}>
            <Check aria-hidden className="size-4" />
            Lengkap
          </button>
          <button type="button" onClick={() => setAction("tidak_cocok")} className={`${button} border-bad text-bad hover:bg-surface`}>
            <X aria-hidden className="size-4" />
            Tidak cocok
          </button>
        </>
      ) : null}
      {canDelete ? (
        <button type="button" onClick={() => setAction("hapus")} className={`${button} border-bad text-bad hover:bg-surface`}>
          <Trash2 aria-hidden className="size-4" />
          Hapus
        </button>
      ) : null}
      <ConfirmationDialog
        open={action !== null}
        title={current?.title ?? ""}
        description={current?.description ?? ""}
        confirmLabel={current?.label ?? ""}
        danger={current?.danger}
        pending={pending}
        error={error}
        onCancel={() => setAction(null)}
        onConfirm={() => void run()}
      />
    </div>
  );
}
