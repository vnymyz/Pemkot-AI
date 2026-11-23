import { DOKUMEN_MAX_BYTES } from "./vendor-document-schema";

/** Error codes from the document services, with the HTTP status and the message shown to the user. */
export const DOC_ERRORS: Record<string, { status: number; pesan: string }> = {
  akses_ditolak: { status: 403, pesan: "Akun ini tidak dapat mengelola dokumen vendor tersebut." },
  vendor_tidak_ditemukan: { status: 404, pesan: "Vendor tidak ditemukan." },
  dokumen_tidak_ditemukan: { status: 404, pesan: "Dokumen tidak ditemukan." },
  bukan_draft: { status: 409, pesan: "Dokumen hanya dapat diubah saat vendor berstatus draft." },
  file_tidak_valid: {
    status: 400,
    pesan: `File harus berupa PDF, PNG, atau JPEG dengan ukuran maksimal ${DOKUMEN_MAX_BYTES / 1024 / 1024} MB.`,
  },
};
