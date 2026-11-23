import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { ajukanAktivasiVendor, VendorError } from "@/lib/services/vendor";

const requestSchema = z.object({ vendor_id: z.uuid() });

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Hanya Admin Pengadaan yang dapat mengajukan aktivasi vendor." },
  vendor_tidak_valid: { status: 409, pesan: "Hanya vendor berstatus verifikasi yang dapat diajukan untuk aktivasi." },
  vendor_sudah_memiliki_usulan: { status: 409, pesan: "Vendor sudah memiliki usulan yang menunggu keputusan." },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ pesan: "Vendor tidak valid." }, { status: 400 });

  try {
    return Response.json(await ajukanAktivasiVendor(state.session, parsed.data.vendor_id));
  } catch (error) {
    if (error instanceof VendorError && MESSAGES[error.message]) {
      const { status, pesan } = MESSAGES[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[vendor] activation failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Usulan aktivasi belum dibuat. Silakan coba lagi." }, { status: 500 });
  }
}
