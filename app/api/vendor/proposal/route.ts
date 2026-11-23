import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { ajukanPerubahanVendor, VendorError } from "@/lib/services/vendor";
import { draftVendorSchema } from "@/lib/vendor-schema";

const requestSchema = draftVendorSchema.extend({ vendor_id: z.uuid() });

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Hanya Admin Pengadaan yang dapat mengajukan perubahan vendor." },
  vendor_tidak_valid: { status: 404, pesan: "Vendor aktif tidak ditemukan." },
  npwp_terdaftar: { status: 409, pesan: "NPWP ini sudah digunakan vendor lain." },
  vendor_sudah_memiliki_usulan: { status: 409, pesan: "Vendor sudah memiliki usulan yang menunggu keputusan." },
  data_tidak_valid: { status: 400, pesan: "Data perubahan tidak valid." },
  kategori_tidak_valid: { status: 400, pesan: "Salah satu kategori layanan sudah tidak tersedia. Periksa kembali katalog." },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ pesan: "Data perubahan tidak dapat dibaca." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ pesan: "Periksa kembali data vendor dan katalog layanannya." }, { status: 400 });
  }

  try {
    const { vendor_id: vendorId, ...data } = parsed.data;
    const result = await ajukanPerubahanVendor(state.session, vendorId, data);
    return Response.json(result);
  } catch (error) {
    if (error instanceof VendorError && MESSAGES[error.message]) {
      const { status, pesan } = MESSAGES[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[vendor] change proposal failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Usulan perubahan belum dibuat. Silakan coba lagi." }, { status: 500 });
  }
}
