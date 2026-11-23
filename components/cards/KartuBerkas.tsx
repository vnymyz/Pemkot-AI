"use client";

import { Download, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { formatTanggal } from "@/lib/format";

export type BerkasCard = {
  id: string;
  nama: string;
  jenis: "xlsx" | "pptx" | "docx";
  baris: number | null;
  slide: number | null;
  dibuat: string;
};

const JENIS_LABEL = { xlsx: "Excel", pptx: "PowerPoint", docx: "Word" } as const;

const announced = new Set<string>();
const FRESH_MS = 30_000;

/** Download card for a file the assistant created. The link is made fresh when clicked. */
export function KartuBerkas({ data }: { data: { berkas: BerkasCard } }) {
  const { berkas } = data;

  // Only a file made just now is announced, so old chats opened from history stay quiet.
  useEffect(() => {
    if (announced.has(berkas.id)) return;
    announced.add(berkas.id);
    if (Date.now() - new Date(berkas.dibuat).getTime() < FRESH_MS) toast.success("File siap diunduh.");
  }, [berkas.id, berkas.dibuat]);
  const Icon = { xlsx: FileSpreadsheet, pptx: Presentation, docx: FileText }[berkas.jenis];
  const size = berkas.jenis === "pptx" ? `${berkas.slide ?? 0} slide` : `${berkas.baris ?? 0} baris`;

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-4">
      <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Icon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-card font-semibold break-all text-navy">{berkas.nama}</h3>
        <p className="text-caption text-muted">
          {JENIS_LABEL[berkas.jenis]} · {size} · dibuat {formatTanggal(berkas.dibuat)}
        </p>
        <p className="text-caption text-muted">Tautan unduh dibuat saat diklik dan berlaku 1 jam.</p>
      </div>
      <a
        href={`/api/berkas/${berkas.id}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-table font-medium text-surface hover:bg-navy"
      >
        <Download aria-hidden className="size-4" />
        Unduh
      </a>
    </article>
  );
}
