"use client";

import type { UIMessage } from "ai";
import { Bot } from "lucide-react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { FormDaftarVendor } from "@/components/cards/FormDaftarVendor";
import { KartuDaftarProyek, KartuDetailProyek } from "@/components/cards/KartuProyek";
import { KartuKetersediaan, KartuRekomendasi, KartuUsulanPenugasan } from "@/components/cards/KartuRekomendasi";
import { KartuDaftarVendor, KartuProfilVendor } from "@/components/cards/KartuVendor";
import { Spinner } from "@/components/ui/spinner";
import { cleanAssistantText } from "@/lib/ai/text";

const Markdown = dynamic(() => import("./Markdown"), {
  loading: () => <span className="text-muted">Memuat</span>,
});

const PENDING: Record<string, string> = {
  "tool-cari_vendor": "Mencari data vendor",
  "tool-cek_vendor": "Membaca profil vendor",
  "tool-daftar_vendor": "Menyiapkan form pendaftaran",
  "tool-daftar_proyek": "Mencari data proyek",
  "tool-detail_proyek": "Membaca detail proyek",
  "tool-rekomendasikan_vendor": "Menghitung vendor yang ready",
  "tool-cek_ketersediaan_vendor": "Mengecek ketersediaan vendor",
  "tool-ajukan_penugasan": "Menyiapkan konfirmasi usulan",
};

export function AssistantRow({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1.5 text-caption font-medium text-muted">
        <Bot aria-hidden className="size-4 text-primary" />
        Asisten Pemkot
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ToolPending({ label }: { label: string }) {
  return (
    <div role="status" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-table text-muted">
      <Spinner className="size-4 text-primary" />
      {label}
    </div>
  );
}

export function MessageBubble({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-md bg-primary px-4 py-2.5 break-words whitespace-pre-wrap text-surface">{text}</div>
      </div>
    );
  }

  const blocks = message.parts.map((part, index) => {
    const key = `${message.id}-${index}`;
    if (part.type === "text") {
      const shown = cleanAssistantText(part.text);
      if (!shown) return null;
      return (
        <div key={key} className="md overflow-x-auto rounded-md border border-line bg-surface px-4 py-3 break-words">
          <Markdown>{shown}</Markdown>
        </div>
      );
    }
    if (!part.type.startsWith("tool-") || !("state" in part)) return null;
    if (part.state === "input-streaming" || part.state === "input-available") {
      return <ToolPending key={key} label={PENDING[part.type] ?? "Memproses"} />;
    }
    if (part.state !== "output-available") return null;
    const output = part.output as Record<string, unknown> | null;
    if (!output || "error" in output) return null; // the assistant explains errors in text

    switch (part.type) {
      case "tool-cari_vendor":
        return <KartuDaftarVendor key={key} data={output as never} />;
      case "tool-cek_vendor":
        return <KartuProfilVendor key={key} data={output as never} />;
      case "tool-daftar_vendor":
        return <FormDaftarVendor key={key} data={output as never} />;
      case "tool-daftar_proyek":
        return <KartuDaftarProyek key={key} data={output as never} />;
      case "tool-detail_proyek":
        return <KartuDetailProyek key={key} data={output as never} />;
      case "tool-rekomendasikan_vendor":
        return <KartuRekomendasi key={key} data={output as never} />;
      case "tool-cek_ketersediaan_vendor":
        return <KartuKetersediaan key={key} data={output as never} />;
      case "tool-ajukan_penugasan":
        return <KartuUsulanPenugasan key={key} data={output as never} />;
      default:
        return null;
    }
  });

  if (blocks.every((block) => block === null)) return null;
  return <AssistantRow>{blocks}</AssistantRow>;
}
