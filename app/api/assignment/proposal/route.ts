import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { ApprovalError, ajukanPenugasan } from "@/lib/services/approval";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

const requestSchema = z.object({
  project_id: z.uuid(),
  vendor_id: z.uuid(),
  tenaga: z.number().int().min(0).max(100000),
  mulai: isoDate,
  selesai: isoDate,
  nilai: z.number().min(0).nullable(),
});

const MESSAGES: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Akun ini tidak memiliki akses untuk mengajukan penugasan." },
  vendor_bukan_ready: { status: 409, pesan: "Vendor ini sudah tidak ready untuk proyek tersebut." },
  kapasitas_tidak_cukup: { status: 409, pesan: "Kapasitas vendor sudah tidak cukup untuk usulan ini." },
  periode_diluar_proyek: { status: 400, pesan: "Periode penugasan harus berada di dalam periode proyek." },
  penugasan_sudah_ada: { status: 409, pesan: "Vendor sudah memiliki usulan atau penugasan aktif pada proyek ini." },
  vendor_dalam_proses_arsip: { status: 409, pesan: "Vendor sedang menunggu persetujuan untuk diarsipkan." },
  data_tidak_valid: { status: 400, pesan: "Data usulan tidak valid. Silakan buat ulang usulan." },
};

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ pesan: "Data usulan tidak dapat dibaca." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ pesan: "Data usulan tidak valid. Silakan buat ulang usulan." }, { status: 400 });
  }

  try {
    const result = await ajukanPenugasan(state.session, {
      projectId: parsed.data.project_id,
      vendorId: parsed.data.vendor_id,
      tenaga: parsed.data.tenaga,
      mulai: parsed.data.mulai,
      selesai: parsed.data.selesai,
      nilai: parsed.data.nilai ?? undefined,
    });
    return Response.json({ result });
  } catch (error) {
    if (error instanceof ApprovalError && MESSAGES[error.message]) {
      const { status, pesan } = MESSAGES[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[assignment] proposal failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Usulan belum dibuat. Silakan coba lagi." }, { status: 500 });
  }
}
