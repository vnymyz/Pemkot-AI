import type { DraftVendor } from "@/lib/vendor-schema";

export type ProposalOutput = {
  assignment_id: string;
  approval_id: string;
  status: "diusulkan";
};

type ApprovalBase = {
  id: string;
  status: "pending" | "approved" | "rejected";
  catatan: string | null;
  created_at: string;
  decided_at: string | null;
  pengusul: string;
};

export type ApprovalRingkas = ApprovalBase &
  (
    | {
        jenis: "project_assignment";
        assignment_id: string;
        project_id: string;
        project_nomor: string;
        project_judul: string;
        vendor_id: string;
        vendor_nama: string;
        status_penugasan: string;
        tenaga_dialokasikan: number;
        mulai: string;
        selesai: string;
        nilai: number | null;
      }
    | {
        jenis: "vendor_activation" | "vendor_archive";
        vendor_id: string;
        vendor_nama: string;
      }
    | {
        jenis: "vendor_update";
        vendor_id: string;
        vendor_nama: string;
        vendor_data: DraftVendor;
      }
  );
