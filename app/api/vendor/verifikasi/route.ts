import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { kirimVerifikasiVendor, VendorError } from "@/lib/services/vendor";

const requestSchema = z.object({ vendor_id: z.uuid() });

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Akun ini tidak dapat mengirim vendor tersebut untuk verifikasi." },
  vendor_tidak_ditemukan: { status: 404, pesan: "Vendor tidak ditemukan." },
  bukan_draft: { status: 409, pesan: "Hanya vendor berstatus draft yang dapat dikirim untuk verifikasi." },
  layanan_kosong: { status: 409, pesan: "Tambahkan minimal satu layanan pada katalog sebelum verifikasi." },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ pesan: "Vendor tidak valid." }, { status: 400 });

  try {
    return Response.json(await kirimVerifikasiVendor(state.session, parsed.data.vendor_id));
  } catch (error) {
    if (error instanceof VendorError) {
      if (error.message === "dokumen_belum_lengkap") {
        return Response.json(
          { pesan: `Dokumen belum lengkap${error.detail ? `: ${error.detail}` : ""}. Unggah dan pastikan statusnya Lengkap.` },
          { status: 409 },
        );
      }
      if (MESSAGES[error.message]) {
        const { status, pesan } = MESSAGES[error.message];
        return Response.json({ pesan }, { status });
      }
    }
    console.error("[vendor] verification failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Vendor belum terkirim untuk verifikasi. Silakan coba lagi." }, { status: 500 });
  }
}
