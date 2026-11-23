import type { ReactNode } from "react";
import { navForRole, ROLE_LABELS } from "@/lib/auth/roles";
import type { AuthSession } from "@/lib/auth/session";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { Tour } from "@/components/tour/Tour";
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
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-table focus:font-medium focus:text-primary focus:shadow-[var(--shadow-overlay)]"
      >
        Lewati ke isi halaman
      </a>
      <Onboarding role={session.role} />
      <Tour role={session.role} />
      <SidebarNav
        items={navForRole(session.role)}
        nama={session.nama}
        peran={ROLE_LABELS[session.role]}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {fullHeight ? null : (
          <header className="no-print sticky top-0 z-30 h-[60px] shrink-0 border-b border-line bg-bg">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6">
              <span aria-hidden className="hidden md:block" />
              <GlobalSearch />
              <div className="flex shrink-0 items-center justify-self-end gap-1 md:gap-3">
                <NavbarClock />
                <div data-tour="notif">
                  <NavbarNotifications userId={session.userId} />
                </div>
              </div>
            </div>
          </header>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <main id="isi" className={fullHeight ? "flex min-h-0 flex-1 flex-col" : "flex-1 px-4 py-6 md:px-10 md:py-10"}>
            {fullHeight ? children : <div className="mx-auto w-full max-w-7xl">{children}</div>}
          </main>
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
