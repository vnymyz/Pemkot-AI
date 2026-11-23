export const ROLES = ["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin_pengadaan: "Admin Pengadaan",
  pic_proyek: "PIC Proyek",
  kepala_dinas: "Kepala Dinas",
  vendor: "Vendor",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export type NavKey = "dashboard" | "chat" | "vendor" | "proyek" | "penugasan" | "persetujuan" | "berkas";

export type NavItem = {
  key: NavKey;
  label: string;
  /** Set only when the page exists. Other items render as disabled until their phase. */
  href?: string;
};

const INTERNAL_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "chat", label: "Asisten AI", href: "/chat" },
  { key: "vendor", label: "Vendor", href: "/vendor" },
  { key: "proyek", label: "Proyek", href: "/proyek" },
  { key: "penugasan", label: "Penugasan", href: "/penugasan" },
  { key: "berkas", label: "Berkas", href: "/berkas" },
];

const VENDOR_NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "chat", label: "Asisten AI", href: "/chat" },
  { key: "vendor", label: "Data Vendor Saya", href: "/vendor" },
  { key: "penugasan", label: "Penugasan Saya", href: "/penugasan" },
  { key: "berkas", label: "Berkas", href: "/berkas" },
];

export function navForRole(role: Role): NavItem[] {
  if (role === "vendor") return VENDOR_NAV;
  if (role === "kepala_dinas") {
    return [
      ...INTERNAL_NAV.slice(0, -1),
      { key: "persetujuan", label: "Persetujuan", href: "/persetujuan" },
      INTERNAL_NAV.at(-1)!,
    ];
  }
  return INTERNAL_NAV;
}
