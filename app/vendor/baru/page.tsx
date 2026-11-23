import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormDaftarVendor } from "@/components/cards/FormDaftarVendor";
import { getSessionState } from "@/lib/auth/session";
import { formDaftarVendor } from "@/lib/services/vendor";

export const metadata: Metadata = { title: "Tambah Vendor | Pemkot-AI" };

export default async function TambahVendorPage() {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  if (state.session.role !== "admin_pengadaan") {
    return (
      <p className="panel rounded-md border border-line bg-surface p-4 text-table text-muted">
        Halaman ini hanya dapat digunakan Admin Pengadaan.
      </p>
    );
  }

  const form = await formDaftarVendor(state.session, {});
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/vendor" className="inline-flex min-h-11 items-center gap-2 text-table font-medium text-primary">
        <ArrowLeft aria-hidden className="size-4" />
        Kembali ke daftar vendor
      </Link>
      <div>
        <h1 className="text-page font-semibold text-navy">Tambah vendor</h1>
        <p className="mt-1 text-table text-muted">Vendor baru akan tersimpan sebagai Draft dan belum aktif.</p>
      </div>
      <FormDaftarVendor data={form} />
    </div>
  );
}
