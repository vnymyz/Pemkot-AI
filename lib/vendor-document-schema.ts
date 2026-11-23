import { z } from "zod";

/** Documents a vendor can upload. The first three are required before verification. */
export const DOKUMEN_JENIS = ["NIB", "NPWP", "Akta", "SBU", "K3"] as const;
export const DOKUMEN_WAJIB = ["NIB", "NPWP", "Akta"] as const;
export type DokumenJenis = (typeof DOKUMEN_JENIS)[number];

export const DOKUMEN_LABEL: Record<DokumenJenis, string> = {
  NIB: "NIB (Nomor Induk Berusaha)",
  NPWP: "NPWP",
  Akta: "Akta pendirian",
  SBU: "SBU (Sertifikat Badan Usaha)",
  K3: "Sertifikat K3",
};

export const DOKUMEN_STATUS = ["belum", "lengkap", "tidak_cocok", "perlu_diperiksa_manual"] as const;

/** Vercel functions accept request bodies up to 4.5 MB, so the limit stays below that. */
export const DOKUMEN_MAX_BYTES = 4 * 1024 * 1024;
export const DOKUMEN_ACCEPT = "application/pdf,image/png,image/jpeg";

export const jenisSchema = z.enum(DOKUMEN_JENIS);

const MAGIC: { mediaType: string; ext: string; bytes: number[] }[] = [
  { mediaType: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mediaType: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mediaType: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
];

/** Detects the real file type from its first bytes. The browser's file type is never trusted. */
export function detectFileType(bytes: Uint8Array) {
  return MAGIC.find((item) => item.bytes.every((value, index) => bytes[index] === value)) ?? null;
}
