import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/db/admin";
import { rekomendasiProyek } from "./recommendation";
import type { ApprovalRingkas, ProposalOutput } from "./approval-types";
import { draftVendorSchema } from "@/lib/vendor-schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ApprovalError extends Error {}

export async function ajukanPenugasan(
  session: AuthSession,
  input: {
    projectId: string;
    vendorId: string;
    tenaga: number;
    mulai: string;
    selesai: string;
    nilai?: number;
  },
): Promise<ProposalOutput> {
  if (!["admin_pengadaan", "pic_proyek"].includes(session.role)) {
    throw new ApprovalError("akses_ditolak");
  }
  if (!UUID.test(input.projectId) || !UUID.test(input.vendorId)) {
    throw new ApprovalError("data_tidak_valid");
  }

  const ranking = await rekomendasiProyek(session, input.projectId);
  const vendor = ranking?.ready.find((item) => item.vendor_id === input.vendorId);
  if (!ranking || !vendor) throw new ApprovalError("vendor_bukan_ready");
  if (input.tenaga > vendor.sisa_tenaga) throw new ApprovalError("kapasitas_tidak_cukup");

  const { data, error } = await adminDb().rpc("ajukan_penugasan", {
    p_actor: session.userId,
    p_project_id: input.projectId,
    p_vendor_id: input.vendorId,
    p_tenaga: input.tenaga,
    p_mulai: input.mulai,
    p_selesai: input.selesai,
    p_nilai: input.nilai ?? null,
  });
  if (error) {
    const code = error.message || error.code;
    if (code.includes("periode_diluar_proyek")) throw new ApprovalError("periode_diluar_proyek");
    if (code.includes("penugasan_sudah_ada")) throw new ApprovalError("penugasan_sudah_ada");
    if (code.includes("vendor_dalam_proses_arsip")) throw new ApprovalError("vendor_dalam_proses_arsip");
    throw new ApprovalError("gagal_mengajukan");
  }
  return data as ProposalOutput;
}

export async function daftarPersetujuan(session: AuthSession): Promise<ApprovalRingkas[]> {
  if (session.role !== "kepala_dinas") return [];

  const db = adminDb();
  const { data: approvals, error } = await db
    .from("approvals")
    .select("id, jenis, payload, status, diusulkan_oleh, catatan, created_at, decided_at")
    .in("jenis", ["project_assignment", "vendor_activation", "vendor_update", "vendor_archive"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(`approvals failed: ${error.code}`);

  const approvalRows = approvals ?? [];
  const assignmentApprovals = approvalRows.filter((item) => item.jenis === "project_assignment");
  const assignmentIds = assignmentApprovals
    .map((item) => payloadString(item.payload, "assignment_id"))
    .filter((id): id is string => Boolean(id));
  const assignmentResult = assignmentIds.length
    ? await db
        .from("project_assignments")
        .select("id, project_id, vendor_id, status, tenaga_dialokasikan, mulai, selesai, nilai")
        .in("id", assignmentIds)
    : null;
  if (assignmentResult?.error) throw new Error(`assignments failed: ${assignmentResult.error.code}`);
  const assignments = assignmentResult?.data ?? [];

  const projectIds = [...new Set(assignments.map((item) => item.project_id))];
  const directVendorIds = approvalRows
    .filter((item) => item.jenis !== "project_assignment")
    .map((item) => payloadString(item.payload, "vendor_id"))
    .filter((id): id is string => Boolean(id));
  const vendorIds = [...new Set([...assignments.map((item) => item.vendor_id), ...directVendorIds])];
  const proposerIds = [...new Set(approvalRows.map((item) => item.diusulkan_oleh).filter((id): id is string => Boolean(id)))];

  const [projectsResult, vendorsResult, profilesResult] = await Promise.all([
    projectIds.length
      ? db.from("projects").select("id, nomor, judul, opd_id").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    vendorIds.length
      ? db.from("vendors").select("id, nama").in("id", vendorIds)
      : Promise.resolve({ data: [], error: null }),
    proposerIds.length
      ? db.from("profiles").select("id, nama").in("id", proposerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectsResult.error || vendorsResult.error || profilesResult.error) {
    throw new Error("approval detail lookup failed");
  }

  const projects = new Map(projectsResult.data?.map((item) => [item.id, item]));
  const vendors = new Map(vendorsResult.data?.map((item) => [item.id, item]));
  const profiles = new Map(profilesResult.data?.map((item) => [item.id, item]));

  return approvalRows.flatMap<ApprovalRingkas>((approval) => {
    const proposer = profiles.get(approval.diusulkan_oleh);
    const base = {
      id: approval.id,
      status: approval.status,
      catatan: approval.catatan,
      created_at: approval.created_at,
      decided_at: approval.decided_at,
      pengusul: proposer?.nama ?? "Tidak ada data",
    };

    if (approval.jenis === "project_assignment") {
      const assignmentId = payloadString(approval.payload, "assignment_id");
      const assignment = assignments.find((item) => item.id === assignmentId);
      if (!assignment) throw new Error(`assignment missing for approval ${approval.id}`);
      const project = projects.get(assignment.project_id);
      const vendor = vendors.get(assignment.vendor_id);
      if (!project || !vendor) throw new Error(`approval details missing for ${approval.id}`);
      return [{
        ...base,
        jenis: "project_assignment" as const,
        assignment_id: assignment.id,
        project_id: project.id,
        project_nomor: project.nomor,
        project_judul: project.judul,
        vendor_id: vendor.id,
        vendor_nama: vendor.nama,
        status_penugasan: assignment.status,
        tenaga_dialokasikan: assignment.tenaga_dialokasikan,
        mulai: assignment.mulai,
        selesai: assignment.selesai,
        nilai: assignment.nilai,
      }];
    }

    const vendorId = payloadString(approval.payload, "vendor_id");
    const vendor = vendorId ? vendors.get(vendorId) : undefined;
    if (!vendorId || !vendor) throw new Error(`vendor missing for approval ${approval.id}`);
    if (approval.jenis === "vendor_update") {
      const data = payloadValue(approval.payload, "data");
      const parsed = draftVendorSchema.safeParse(data);
      if (!parsed.success) throw new Error(`vendor change payload invalid for approval ${approval.id}`);
      return [{ ...base, jenis: "vendor_update" as const, vendor_id: vendor.id, vendor_nama: vendor.nama, vendor_data: parsed.data }];
    }
    if (approval.jenis === "vendor_archive") {
      return [{ ...base, jenis: "vendor_archive" as const, vendor_id: vendor.id, vendor_nama: vendor.nama }];
    }
    if (approval.jenis === "vendor_activation") {
      return [{ ...base, jenis: "vendor_activation" as const, vendor_id: vendor.id, vendor_nama: vendor.nama }];
    }
    throw new Error(`unsupported approval type ${approval.jenis}`);
  });
}

function payloadValue(payload: unknown, key: string): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  return key in payload ? (payload as Record<string, unknown>)[key] : undefined;
}

function payloadString(payload: unknown, key: string): string | null {
  const value = payloadValue(payload, key);
  return typeof value === "string" ? value : null;
}

export async function putuskanPersetujuan(
  session: AuthSession,
  approvalId: string,
  setuju: boolean,
  catatan: string,
) {
  if (session.role !== "kepala_dinas") throw new ApprovalError("akses_ditolak");
  if (!UUID.test(approvalId)) throw new ApprovalError("data_tidak_valid");

  const { data, error } = await adminDb().rpc("apply_approval", {
    p_approval_id: approvalId,
    p_decider: session.userId,
    p_setuju: setuju,
    p_catatan: catatan.trim() || null,
  });
  if (error) {
    if (error.message?.includes("kapasitas_tidak_cukup")) throw new ApprovalError("kapasitas_tidak_cukup");
    if (error.message?.includes("vendor_memiliki_penugasan_aktif")) {
      throw new ApprovalError("vendor_memiliki_penugasan_aktif");
    }
    if (error.message?.includes("vendor_tidak_valid")) throw new ApprovalError("vendor_tidak_valid");
    if (error.message?.includes("kategori_tidak_valid")) throw new ApprovalError("kategori_tidak_valid");
    if (error.code === "23505") throw new ApprovalError("npwp_terdaftar");
    if (error.message?.includes("bukan_pemutus")) throw new ApprovalError("akses_ditolak");
    throw new ApprovalError("gagal_memutuskan");
  }
  return data as "disetujui" | "ditolak" | "sudah_diputuskan";
}
