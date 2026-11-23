"use client";

import {
  ClipboardCheck,
  Files,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  UserCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavItem, NavKey } from "@/lib/auth/roles";
import { Brand } from "./brand";
import { SignOutButton } from "./sign-out-button";

const ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  chat: MessageSquare,
  vendor: Store,
  proyek: FolderKanban,
  penugasan: UserCheck,
  persetujuan: ClipboardCheck,
  berkas: Files,
};

const STORAGE_KEY = "pemkot_sidebar_collapsed";
const rowClass = "flex min-h-11 items-center gap-3 rounded-md px-3 text-table";

export function SidebarNav({ items, nama, peran }: { items: NavItem[]; nama: string; peran: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // phone menu
  const [collapsed, setCollapsed] = useState(false); // desktop icon rail

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // The sidebar still works without saved preferences.
    }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // The choice simply is not remembered.
    }
  }

  const row = `${rowClass} ${collapsed ? "md:justify-center md:px-0" : ""}`;
  const text = collapsed ? "md:sr-only" : "";
  const toggleLabel = collapsed ? "Buka sidebar" : "Tutup sidebar";

  return (
    <aside
      className={`on-navy no-print shrink-0 border-b border-surface/20 bg-navy transition-[width] duration-150 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:self-start md:border-r md:border-b-0 ${
        collapsed ? "md:w-16" : "md:w-60"
      }`}
    >
      <div className={`flex h-[60px] items-center px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className={collapsed ? "md:hidden" : ""}>
          <Brand showSubtitle={false} />
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-11 items-center justify-center rounded-md text-surface transition-colors hover:bg-primary md:hidden"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="hidden size-11 items-center justify-center rounded-md text-surface transition-colors hover:bg-primary md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen aria-hidden className="size-5" /> : <PanelLeftClose aria-hidden className="size-5" />}
        </button>
      </div>

      <div id="main-nav" className={`${open ? "flex" : "hidden"} min-h-0 flex-1 flex-col md:flex`}>
        <nav aria-label="Menu utama" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = ICONS[item.key];
              if (!item.href) {
                return (
                  <li key={item.key}>
                    <span
                      aria-disabled="true"
                      title={collapsed ? `${item.label} (segera)` : undefined}
                      className={`${row} cursor-not-allowed text-surface/60`}
                    >
                      <Icon aria-hidden className="size-4 shrink-0" />
                      <span className={`flex-1 ${text}`}>{item.label}</span>
                      <span className={`text-caption ${text}`}>Segera</span>
                    </span>
                  </li>
                );
              }
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setOpen(false)}
                    className={`${row} font-medium transition-colors ${
                      active ? "bg-surface text-navy" : "text-surface/90 hover:bg-primary"
                    }`}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <span className={text}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-surface/20 p-3">
          <div
            className={`mb-3 flex items-center gap-3 px-1 ${collapsed ? "md:justify-center md:px-0" : ""}`}
            title={collapsed ? `${nama}, ${peran}` : undefined}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-surface/30 bg-primary">
              <UserRound aria-hidden className="size-4 text-surface" />
            </span>
            <span className={`min-w-0 leading-tight ${text}`}>
              <span className="block truncate text-table font-medium text-surface" title={nama}>
                {nama}
              </span>
              <span className="block truncate text-caption text-surface/70">{peran}</span>
            </span>
          </div>
          <SignOutButton fullWidth compact={collapsed} tone="dark" />
        </div>
      </div>
    </aside>
  );
}
