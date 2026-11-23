"use client";

import { CircleCheck, CircleX, Clock, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import type { FormDaftarOutput } from "@/lib/services/vendor-types";
import { VENDOR_TIPE } from "@/lib/vendor-schema";
import { TIPE_LABEL } from "@/lib/format";

type Row = { category_id: string; nama_layanan: string; deskripsi: string; harga_min: string; harga_maks: string; satuan: string };
type Confirmation = { kind: "save" } | { kind: "add-row" } | { kind: "delete-row"; index: number } | null;

const input = "mt-1 block h-11 w-full panel rounded-md border border-line bg-surface px-3 text-table text-text";
const label = "block text-caption font-medium";
const emptyRow = (): Row => ({ category_id: "", nama_layanan: "", deskripsi: "", harga_min: "", harga_maks: "", satuan: "" });

export function FormDaftarVendor({ data }: { data: FormDaftarOutput }) {
  const router = useRouter();
  const editable = data.mode !== "tidak_bisa" ? data : null;
  const prefill = editable?.prefill;
  const [form, setForm] = useState({
    nama: prefill?.nama ?? "",
    npwp: prefill?.npwp ?? "",
    alamat: prefill?.alamat ?? "",
    wilayah: prefill?.wilayah ?? "",
    kontak: prefill?.kontak ?? "",
    tipe: prefill?.tipe ?? "jasa",
    kapasitas_proyek: String(prefill?.kapasitas_proyek ?? 1),
    total_tenaga: prefill?.total_tenaga ? String(prefill.total_tenaga) : "",
  });
  const [rows, setRows] = useState<Row[]>(() =>
    prefill?.layanan?.length
      ? prefill.layanan.map((item) => ({
          category_id: String(item.category_id),
          nama_layanan: item.nama_layanan,
          deskripsi: item.deskripsi ?? "",
          harga_min: item.harga_min === null ? "" : String(Number(item.harga_min)),
          harga_maks: item.harga_maks === null ? "" : String(Number(item.harga_maks)),
          satuan: item.satuan,
        }))
      : [emptyRow()],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  if (saved) {
    return (
      <div role="status" className="rounded-md border border-ok bg-surface p-4 text-table">
        <p className="flex items-center gap-2 font-semibold text-ok">
          <CircleCheck aria-hidden className="size-4" />
          {data.mode === "ajukan_perubahan" ? "Usulan perubahan vendor terkirim" : "Draft vendor tersimpan"}
        </p>
        <p className="mt-1 text-muted">
          {data.mode === "ajukan_perubahan"
            ? "Data vendor aktif belum berubah. Usulan ini menunggu keputusan Kepala Dinas."
            : "Vendor belum aktif. Langkah berikutnya adalah pemeriksaan dokumen, lalu aktivasi menunggu persetujuan Kepala Dinas."}
        </p>
      </div>
    );
  }

  if (data.mode === "tidak_bisa") {
    return (
      <p className="flex items-start gap-2 rounded-md border border-warn bg-surface p-3 text-table text-warn">
        <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
        {data.pesan}
      </p>
    );
  }

  const setRow = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function saveDraft() {
    setPending(true);
    setError(null);
    const failureMessage =
      data.mode === "ajukan_perubahan"
        ? "Usulan perubahan belum dibuat. Silakan coba lagi."
        : "Draft belum tersimpan. Silakan coba lagi.";
    try {
      const response = await fetch(data.mode === "ajukan_perubahan" ? "/api/vendor/proposal" : "/api/vendor/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vendor_id: editable?.vendor_id ?? null,
          kapasitas_proyek: Number(form.kapasitas_proyek),
          total_tenaga: Number(form.total_tenaga),
          layanan: rows.map((row) => ({
            category_id: Number(row.category_id),
            nama_layanan: row.nama_layanan,
            deskripsi: row.deskripsi,
            harga_min: Number(row.harga_min),
            harga_maks: Number(row.harga_maks),
            satuan: row.satuan,
          })),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { pesan?: string };
      if (!response.ok) setError(result.pesan ?? failureMessage);
      else {
        setSaved(true);
        toast.success(
          data.mode === "ajukan_perubahan"
            ? "Usulan perubahan dibuat. Menunggu persetujuan Kepala Dinas."
            : "Draft vendor disimpan.",
        );
        router.refresh();
      }
    } catch {
      setError(failureMessage);
    } finally {
      setPending(false);
    }
  }

  function requestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmation({ kind: "save" });
  }

  function confirmAction() {
    if (!confirmation) return;
    const action = confirmation;
    setConfirmation(null);
    if (action.kind === "save") {
      void saveDraft();
    } else if (action.kind === "add-row") {
      setRows((current) => [...current, emptyRow()]);
    } else {
      setRows((current) => current.filter((_, index) => index !== action.index));
    }
  }

  const confirmationDetails =
    confirmation?.kind === "save"
      ? {
          title: data.mode === "ajukan_perubahan"
            ? "Ajukan perubahan vendor aktif?"
            : data.mode === "perbarui"
              ? "Simpan perubahan draft vendor?"
              : "Simpan pendaftaran vendor?",
          description: data.mode === "ajukan_perubahan"
            ? "Data aktif tidak berubah sebelum Kepala Dinas menyetujui usulan ini."
            : "Data akan disimpan sebagai draft dan belum aktif. Pastikan informasi sudah benar.",
          confirmLabel: data.mode === "ajukan_perubahan" ? "Ajukan perubahan" : "Simpan draft",
          danger: false,
        }
      : confirmation?.kind === "add-row"
        ? {
            title: "Tambah layanan?",
            description: data.mode === "ajukan_perubahan"
              ? "Baris layanan kosong akan ditambahkan ke usulan perubahan; data aktif belum berubah."
              : "Baris layanan kosong akan ditambahkan ke formulir dan tersimpan setelah draft disimpan.",
            confirmLabel: "Tambah layanan",
            danger: false,
          }
        : confirmation?.kind === "delete-row"
          ? {
              title: "Hapus layanan dari formulir?",
              description: data.mode === "ajukan_perubahan"
                ? "Layanan akan dihapus dari usulan. Katalog aktif tidak berubah sebelum Kepala Dinas menyetujui."
                : "Layanan akan dihapus dari draft setelah Bapak/Ibu menyimpan perubahan.",
              confirmLabel: "Hapus layanan",
              danger: true,
            }
          : null;

  const text = (key: keyof typeof form, title: string, extra = {}) => (
    <label className={label}>
      {title}
      <input
        required
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        className={input}
        {...extra}
      />
    </label>
  );

  return (
    <>
    <form onSubmit={requestSubmit} className="panel rounded-md border border-line bg-surface p-4">
      <h3 className="text-card font-semibold text-navy">
        {data.mode === "ajukan_perubahan"
          ? "Usulkan perubahan data vendor"
          : data.mode === "perbarui"
            ? "Lengkapi data draft vendor"
            : "Form pendaftaran vendor"}
      </h3>
      <p className="mt-1 text-caption text-muted">
        {data.mode === "ajukan_perubahan"
          ? "Perubahan vendor aktif memerlukan persetujuan Kepala Dinas."
          : "Gunakan data fiktif. Data disimpan sebagai draft dan belum aktif."}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {text("nama", "Nama usaha", { minLength: 3, maxLength: 120 })}
        {text("npwp", "NPWP (15 atau 16 angka)", { maxLength: 25, inputMode: "numeric" })}
        {text("alamat", "Alamat", { minLength: 5, maxLength: 200 })}
        {text("wilayah", "Wilayah", { maxLength: 80 })}
        {text("kontak", "Kontak", { maxLength: 120 })}
        <label className={label}>
          Tipe
          <select value={form.tipe} onChange={(event) => setForm((current) => ({ ...current, tipe: event.target.value }))} className={input}>
            {VENDOR_TIPE.map((item) => (
              <option key={item} value={item}>{TIPE_LABEL[item]}</option>
            ))}
          </select>
        </label>
        {text("kapasitas_proyek", "Kapasitas proyek paralel", { type: "number", min: 1, max: 100, step: 1 })}
        {text("total_tenaga", "Jumlah tenaga kerja", { type: "number", min: 1, max: 100000, step: 1 })}
      </div>

      <h4 className="mt-4 text-table font-semibold">Katalog barang dan jasa</h4>
      <div className="mt-2 space-y-3">
        {rows.map((row, index) => (
          <fieldset key={index} className="rounded-md border border-line p-3">
            <legend className="px-1 text-caption font-medium">Layanan {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Kategori
                <select required value={row.category_id} onChange={(event) => setRow(index, { category_id: event.target.value })} className={input}>
                  <option value="">Pilih kategori</option>
                  {editable?.kategori.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Nama layanan
                <input required minLength={2} maxLength={120} value={row.nama_layanan} onChange={(event) => setRow(index, { nama_layanan: event.target.value })} className={input} />
              </label>
              <label className={label}>
                Harga minimal (Rp)
                <input required type="number" min={0} step={1} value={row.harga_min} onChange={(event) => setRow(index, { harga_min: event.target.value })} className={input} />
              </label>
              <label className={label}>
                Harga maksimal (Rp)
                <input required type="number" min={0} step={1} value={row.harga_maks} onChange={(event) => setRow(index, { harga_maks: event.target.value })} className={input} />
              </label>
              <label className={label}>
                Satuan
                <input required maxLength={30} placeholder="unit, paket, bulan" value={row.satuan} onChange={(event) => setRow(index, { satuan: event.target.value })} className={input} />
              </label>
              <label className={label}>
                Deskripsi (opsional)
                <input maxLength={300} value={row.deskripsi} onChange={(event) => setRow(index, { deskripsi: event.target.value })} className={input} />
              </label>
            </div>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => setConfirmation({ kind: "delete-row", index })}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border border-bad bg-surface px-3 text-table font-medium text-bad"
              >
                <Trash2 aria-hidden className="size-4" />
                Hapus layanan
              </button>
            ) : null}
          </fieldset>
        ))}
      </div>

      {rows.length < 10 ? (
        <button
          type="button"
          onClick={() => setConfirmation({ kind: "add-row" })}
          className="mt-3 inline-flex min-h-11 items-center gap-2 panel rounded-md border border-line bg-surface px-3 text-table font-medium text-primary hover:bg-primary-soft"
        >
          <Plus aria-hidden className="size-4" />
          Tambah layanan
        </button>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-bad p-3 text-table text-bad">
          <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-surface hover:bg-navy disabled:cursor-not-allowed disabled:bg-line disabled:text-muted sm:ml-2 sm:w-auto"
      >
        {pending ? <Spinner /> : null}
        {data.mode === "ajukan_perubahan" ? "Ajukan perubahan" : "Simpan sebagai draft"}
      </button>
    </form>
    <ConfirmationDialog
      open={confirmation !== null}
      title={confirmationDetails?.title ?? ""}
      description={confirmationDetails?.description ?? ""}
      confirmLabel={confirmationDetails?.confirmLabel ?? "Konfirmasi"}
      danger={confirmationDetails?.danger}
      pending={pending}
      onCancel={() => setConfirmation(null)}
      onConfirm={confirmAction}
    />
    </>
  );
}
