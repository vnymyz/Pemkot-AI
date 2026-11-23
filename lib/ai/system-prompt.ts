import "server-only";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";
import { formatTanggal, tanggalHariIni } from "@/lib/format";
import { PERSONA } from "./persona";

export function buildInstructions(session: AuthSession) {
  const scope =
    session.role === "vendor"
      ? "This account may only see its own vendor data and the projects assigned to it."
      : session.role === "pic_proyek"
        ? `This account may search vendors and may only see projects of ${session.opdNama ?? "its own agency"}.`
        : "This account may search vendors and view all projects.";

  return `${PERSONA}

# Context
Today is ${formatTanggal(tanggalHariIni())} (Asia/Jakarta).
The user's role is ${ROLE_LABELS[session.role]}. ${scope}`;
}
