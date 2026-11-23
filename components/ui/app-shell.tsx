import type { ReactNode } from "react";
import { navForRole, ROLE_LABELS } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";
import { GlobalSearch } from "./global-search";
import { NavbarClock } from "./navbar-clock";
import { NavbarNotifications } from "./navbar-notifications";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  session,
  children,
  fullHeight = false,
}: {
  session: AuthSession;
  children: ReactNode;
  /** For the chat page: fills the screen and scrolls inside. */
  fullHeight?: boolean;
}) {
  return (
    <div className={`flex ${fullHeight ? "h-dvh overflow-hidden" : "min-h-dvh"} flex-col md:flex-row`}>
      <SidebarNav
        items={navForRole(session.role)}
        nama={session.nama}
        peran={ROLE_LABELS[session.role]}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {fullHeight ? null : (
          <header className="no-print sticky top-0 z-30 h-[60px] shrink-0 border-b border-line bg-primary-soft">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6">
              <span aria-hidden className="hidden md:block" />
              <GlobalSearch />
              <div className="flex shrink-0 items-center justify-self-end gap-1 md:gap-3">
                <NavbarClock />
                <NavbarNotifications userId={session.userId} />
              </div>
            </div>
          </header>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <main className={fullHeight ? "flex min-h-0 flex-1 flex-col" : "flex-1 p-4 md:p-6"}>{children}</main>
          {fullHeight ? null : (
            <footer className="no-print border-t border-line px-4 py-3 text-caption text-muted md:px-6">
              Versi demo 0.1. Seluruh data bersifat fiktif.
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
