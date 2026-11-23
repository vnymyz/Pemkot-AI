import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/ui/protected-shell";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell fullHeight>{children}</ProtectedShell>;
}
