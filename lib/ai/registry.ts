import "server-only";
import type { ToolSet } from "ai";
import type { Role } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";
import { ajukanPenugasanTool } from "./tools/ajukan-penugasan";
import { buatExcelTool } from "./tools/buat-excel";
import { buatPowerPointTool } from "./tools/buat-powerpoint";
import { buatWordTool } from "./tools/buat-word";
import { cariVendorTool } from "./tools/cari-vendor";
import { cekKetersediaanVendorTool } from "./tools/cek-ketersediaan-vendor";
import { cekVendorTool } from "./tools/cek-vendor";
import { daftarProyekTool } from "./tools/daftar-proyek";
import { daftarVendorTool } from "./tools/daftar-vendor";
import { detailProyekTool } from "./tools/detail-proyek";
import { rekomendasikanVendorTool } from "./tools/rekomendasikan-vendor";
import { ringkasDataTool } from "./tools/ringkas-data";

const ALL_ROLES: Role[] = ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"];

const REGISTRY: Record<string, { roles: Role[]; build: (session: AuthSession) => ToolSet[string] }> = {
  cari_vendor: { roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas"], build: cariVendorTool },
  cek_vendor: { roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"], build: cekVendorTool },
  daftar_vendor: { roles: ["admin_pengadaan", "vendor"], build: daftarVendorTool },
  daftar_proyek: { roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"], build: daftarProyekTool },
  detail_proyek: { roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"], build: detailProyekTool },
  cek_ketersediaan_vendor: {
    roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"],
    build: cekKetersediaanVendorTool,
  },
  rekomendasikan_vendor: { roles: ["admin_pengadaan", "pic_proyek", "kepala_dinas"], build: rekomendasikanVendorTool },
  ajukan_penugasan: { roles: ["admin_pengadaan", "pic_proyek"], build: ajukanPenugasanTool },
  buat_excel: { roles: ALL_ROLES, build: buatExcelTool },
  buat_powerpoint: { roles: ALL_ROLES, build: buatPowerPointTool },
  buat_word: { roles: ALL_ROLES, build: buatWordTool },
  ringkas_data: { roles: ALL_ROLES, build: ringkasDataTool },
};

/** Built per request. A tool the role may not use is never sent to the model. */
export function toolsForSession(session: AuthSession): ToolSet {
  const tools: ToolSet = {};
  for (const [name, entry] of Object.entries(REGISTRY)) {
    if (entry.roles.includes(session.role)) tools[name] = entry.build(session);
  }
  return tools;
}
