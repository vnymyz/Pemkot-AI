import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { simpanDraftVendor, VendorError } from "@/lib/services/vendor";
import { draftVendorSchema } from "@/lib/vendor-schema";

const requestSchema = draftVendorSchema.extend({ vendor_id: z.uuid().nullable().optional() });

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Akun ini tidak memiliki akses untuk mendaftarkan vendor." },
  bukan_draft: { status: 409, pesan: "Data vendor hanya dapat diubah saat berstatus draft." },
  npwp_terdaftar: { status: 409, pesan: "NPWP ini sudah terdaftar pada vendor lain." },
  vendor_tidak_ditemukan: { status: 404, pesan: "Data vendor tidak ditemukan." },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ pesan: "Data form tidak dapat dibaca." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        pesan:
          "Periksa kembali isian. NPWP harus 15 atau 16 angka, kapasitas dan tenaga minimal 1, dan harga maksimal tidak boleh di bawah harga minimal.",
      },
      { status: 400 },
    );
  }

  try {
    const { vendor_id: vendorId, ...data } = parsed.data;
    const id = await simpanDraftVendor(state.session, data, vendorId);
    return Response.json({ id, status: "draft" });
  } catch (error) {
    if (error instanceof VendorError && MESSAGES[error.message]) {
      const { status, pesan } = MESSAGES[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[vendor] save draft failed:", (error as Error).message);
    return Response.json({ pesan: "Draft belum tersimpan. Silakan coba lagi." }, { status: 500 });
  }
}
