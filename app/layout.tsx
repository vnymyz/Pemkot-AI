import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RouteProgress } from "@/components/ui/route-progress";
import { mono, sans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pemkot-AI",
  description: "Demo asisten pengelolaan vendor dan proyek. Seluruh data bersifat fiktif.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
