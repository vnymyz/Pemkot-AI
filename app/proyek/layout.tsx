import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/ui/protected-shell";

export default function ProyekLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
