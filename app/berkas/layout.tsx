import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/ui/protected-shell";

export default function BerkasLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
