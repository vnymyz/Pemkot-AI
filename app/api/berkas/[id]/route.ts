import { getSessionState } from "@/lib/auth/session";
import { DocumentError, urlBerkas } from "@/lib/services/document";

/** Creates a fresh one-hour download link after checking the role, then redirects to it. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const state = await getSessionState();
  if (state.status !== "ready") return Response.json({ pesan: "Silakan masuk kembali." }, { status: 401 });

  try {
    const { id } = await params;
    return Response.redirect(await urlBerkas(state.session, id), 302);
  } catch (error) {
    if (error instanceof DocumentError) return Response.json({ pesan: "Berkas tidak ditemukan." }, { status: 404 });
    console.error("[berkas] download failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ pesan: "Tautan unduh belum dapat dibuat. Silakan coba lagi." }, { status: 500 });
  }
}
