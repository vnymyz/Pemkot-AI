import { z } from "zod";
import { getSessionState } from "@/lib/auth/session";
import { hapusDokumen, putuskanDokumen, urlDokumen, VendorDocError } from "@/lib/services/vendor-document";
import { DOC_ERRORS } from "@/lib/vendor-document-errors";

type Params = { params: Promise<{ id: string }> };

const decisionSchema = z.object({ lengkap: z.boolean(), catatan: z.string().trim().max(200).optional() });

function failure(error: unknown, label: string) {
  if (error instanceof VendorDocError && DOC_ERRORS[error.message]) {
    const { status, pesan } = DOC_ERRORS[error.message];
    return Response.json({ pesan }, { status });
  }
  console.error(`[vendor-doc] ${label} failed:`, error instanceof Error ? error.message : "unknown error");
  return Response.json({ pesan: "Permintaan belum berhasil. Silakan coba lagi." }, { status: 500 });
}

/** Opens the document through a short-lived signed link. The role is checked first. */
export async function GET(_request: Request, { params }: Params) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });
  try {
    const { id } = await params;
    return Response.redirect(await urlDokumen(state.session, id), 302);
  } catch (error) {
    return failure(error, "open");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });
  try {
    const { id } = await params;
    await hapusDokumen(state.session, id);
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error, "delete");
  }
}

/** Admin settles a document that the automatic check could not judge. */
export async function POST(request: Request, { params }: Params) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ pesan: "Keputusan dokumen tidak valid." }, { status: 400 });
  try {
    const { id } = await params;
    return Response.json(await putuskanDokumen(state.session, id, parsed.data.lengkap, parsed.data.catatan));
  } catch (error) {
    return failure(error, "decision");
  }
}
