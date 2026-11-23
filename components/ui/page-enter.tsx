import type { ReactNode } from "react";

/** One short fade when a page opens. Used by each section's template.tsx so the sidebar does not flicker. */
export function PageEnter({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
