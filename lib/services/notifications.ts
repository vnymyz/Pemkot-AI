import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";

export type ApprovalNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  updated_at: string;
};

export async function daftarNotifikasiPersetujuan(session: AuthSession): Promise<ApprovalNotification[]> {
  if (session.role === "vendor") return [];

  const db = adminDb();
  let query = db
    .from("approvals")
    .select("id, jenis, payload, status, catatan, created_at, decided_at")
    .in("jenis", ["project_assignment", "vendor_activation", "vendor_update", "vendor_archive"]);

  if (session.role === "kepala_dinas") {
    query = query.eq("status", "pending").order("created_at", { ascending: false });
  } else {
    query = query
      .eq("diusulkan_oleh", session.userId)
      .in("status", ["approved", "rejected"])
      .order("decided_at", { ascending: false });
  }

  const { data: approvals, error } = await query.limit(12);
  if (error) throw new Error(`approval notifications failed: ${error.code}`);
  if (!approvals?.length) return [];

  const assignmentIds = approvals
    .map((item) => payloadString(item.payload, "assignment_id"))
    .filter((id): id is string => Boolean(id));
  const assignmentResult = assignmentIds.length
    ? await db.from("project_assignments").select("id, project_id, vendor_id").in("id", assignmentIds)
    : null;
  if (assignmentResult?.error) throw new Error(`notification assignments failed: ${assignmentResult.error.code}`);
  const assignments = assignmentResult?.data ?? [];

  const projectIds = [...new Set(assignments.map((item) => item.project_id))];
  const directVendorIds = approvals
    .map((item) => payloadString(item.payload, "vendor_id"))
    .filter((id): id is string => Boolean(id));
  const vendorIds = [...new Set([...assignments.map((item) => item.vendor_id), ...directVendorIds])];
  const [projectsResult, vendorsResult] = await Promise.all([
    projectIds.length ? db.from("projects").select("id, judul").in("id", projectIds) : Promise.resolve({ data: [], error: null }),
    vendorIds.length ? db.from("vendors").select("id, nama").in("id", vendorIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectsResult.error || vendorsResult.error) throw new Error("notification details lookup failed");

  const projects = new Map(projectsResult.data?.map((item) => [item.id, item]));
  const vendors = new Map(vendorsResult.data?.map((item) => [item.id, item]));
  const assignmentsById = new Map(assignments.map((item) => [item.id, item]));

  return approvals.flatMap((approval) => {
    const decided = approval.status === "approved" || approval.status === "rejected";
    const reason = approval.status === "rejected" && approval.catatan ? ` Catatan: ${approval.catatan}` : "";
    const assignmentId = payloadString(approval.payload, "assignment_id");
    const assignment = assignmentId ? assignmentsById.get(assignmentId) : undefined;
    const vendorId = assignment?.vendor_id ?? payloadString(approval.payload, "vendor_id");
    const vendor = vendorId ? vendors.get(vendorId) : undefined;
    if (!vendor) return [];

    const project = assignment ? projects.get(assignment.project_id) : undefined;
    if (assignment && !project) return [];
    const typeLabel = approvalTypeLabel(approval.jenis);
    const statusText = decided ? (approval.status === "approved" ? "disetujui" : "ditolak") : "menunggu persetujuan";
    return [{
      id: approval.id,
      title: `${typeLabel} ${statusText}`,
      detail: `${vendor.nama}${project ? ` · ${project.judul}` : ""}${reason}`,
      href:
        session.role === "kepala_dinas"
          ? "/persetujuan"
          : project
            ? `/proyek/${project.id}`
            : `/vendor/${vendor.id}`,
      updated_at: approval.decided_at ?? approval.created_at,
    }];
  });
}

function payloadString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function approvalTypeLabel(kind: string) {
  switch (kind) {
    case "project_assignment":
      return "Usulan penugasan";
    case "vendor_update":
      return "Perubahan data vendor";
    case "vendor_archive":
      return "Pengarsipan vendor";
    case "vendor_activation":
      return "Aktivasi vendor";
    default:
      return "Usulan vendor";
  }
}
