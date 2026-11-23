import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { unggahDokumen, VendorDocError } from "@/lib/services/vendor-document";
import { DOC_ERRORS } from "@/lib/vendor-document-errors";
import { jenisSchema } from "@/lib/vendor-document-schema";

export const maxDuration = 60;

const fieldsSchema = z.object({ vendor_id: z.uuid(), jenis: jenisSchema });

export async function POST(request: Request) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ pesan: "Data unggahan tidak dapat dibaca." }, { status: 400 });
  }

  const fields = fieldsSchema.safeParse({ vendor_id: form.get("vendor_id"), jenis: form.get("jenis") });
  const file = form.get("file");
  if (!fields.success || !(file instanceof File)) {
    return Response.json({ pesan: "Pilih jenis dokumen dan file yang akan diunggah." }, { status: 400 });
  }

  try {
    const result = await unggahDokumen(state.session, { vendorId: fields.data.vendor_id, jenis: fields.data.jenis, file });
    return Response.json(result);
  } catch (error) {
    if (error instanceof VendorDocError && DOC_ERRORS[error.message]) {
      const { status, pesan } = DOC_ERRORS[error.message];
      return Response.json({ pesan }, { status });
    }
    console.error("[vendor-doc] upload failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Dokumen belum tersimpan. Silakan coba lagi." }, { status: 500 });
  }
}
