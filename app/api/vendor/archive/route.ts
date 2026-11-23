import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { ajukanArsipVendor, VendorError } from "@/lib/services/vendor";

const requestSchema = z.object({ vendor_id: z.uuid() });

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Hanya Admin Pengadaan yang dapat mengajukan arsip vendor." },
  vendor_tidak_valid: { status: 404, pesan: "Vendor tidak ditemukan atau sudah diarsipkan." },
  vendor_sudah_memiliki_usulan: { status: 409, pesan: "Vendor sudah memiliki usulan yang menunggu keputusan." },
  vendor_memiliki_penugasan_aktif: {
    status: 409,
    pesan: "Vendor memiliki usulan atau penugasan aktif, sehingga belum dapat diarsipkan.",
  },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ pesan: "Data permintaan arsip tidak dapat dibaca." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return Response.json({ pesan: "Vendor tidak valid." }, { status: 400 });

  try {
    const result = await ajukanArsipVendor(state.session, parsed.data.vendor_id);
    return Response.json(result);
  } catch (error) {
    if (error instanceof VendorError && MESSAGES[error.message]) {
      const { status, pesan } = MESSAGES[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[vendor] archive proposal failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Usulan arsip belum dibuat. Silakan coba lagi." }, { status: 500 });
  }
}
