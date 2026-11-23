import type { ReactNode } from "react";
import { PageEnter } from "@/components/ui/page-enter";

export default function Template({ children }: { children: ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
