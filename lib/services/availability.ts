import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import type { Ketersediaan } from "./recommendation-types";
import { temukanVendor } from "./vendor";

export class AvailabilityError extends Error {}

/** Checks one vendor for a period. A vendor account can only ever check itself. */
export async function cekKetersediaan(
  session: AuthSession,
  input: { vendor?: string; mulai: string; selesai: string; tenaga?: number },
): Promise<Ketersediaan | null> {
  const { vendor } = await temukanVendor(session, { nama: input.vendor });
  if (!vendor) return null;

  const { data, error } = await adminDb().rpc("cek_ketersediaan_vendor", {
    p_actor: session.userId,
    p_vendor_id: vendor.id,
    p_mulai: input.mulai,
    p_selesai: input.selesai,
    p_tenaga: input.tenaga ?? 0,
  });
  if (error) {
    if (error.message === "periode_tidak_valid" || error.message === "akses_ditolak") {
      throw new AvailabilityError(error.message);
    }
    throw new Error(`cek_ketersediaan_vendor failed: ${error.code}`);
  }
  return (data ?? null) as Ketersediaan | null;
}
