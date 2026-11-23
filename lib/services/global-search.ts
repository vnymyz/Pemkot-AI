import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import { daftarProyek } from "./project";
import { cariVendor } from "./vendor";

export type GlobalSearchResult = {
  id: string;
  href: string;
  kind: "Vendor" | "Proyek";
  label: string;
  detail: string;
};

export async function globalSearch(session: AuthSession, query: string): Promise<GlobalSearchResult[]> {
  const [projects, vendors] = await Promise.all([
    daftarProyek(session, { kata_kunci: query, limit: 5 }),
    session.role === "vendor"
      ? Promise.resolve([])
      : cariVendor(session, { kata_kunci: query, status: null, limit: 5 }),
  ]);

  const projectResults: GlobalSearchResult[] = projects.map((project) => ({
    id: `project-${project.id}`,
    href: `/proyek/${project.id}`,
    kind: "Proyek",
    label: project.judul,
    detail: project.nomor,
  }));
  const vendorResults: GlobalSearchResult[] =
    session.role === "vendor"
      ? session.vendorId &&
        session.vendorNama?.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))
        ? [{
            id: `vendor-${session.vendorId}`,
            href: `/vendor/${session.vendorId}`,
            kind: "Vendor",
            label: session.vendorNama,
            detail: "Data Vendor Saya",
          }]
        : []
      : vendors.map((vendor) => ({
          id: `vendor-${vendor.id}`,
          href: `/vendor/${vendor.id}`,
          kind: "Vendor",
          label: vendor.nama,
          detail: vendor.wilayah ?? vendor.status,
        }));

  return [...projectResults, ...vendorResults].slice(0, 10);
}
