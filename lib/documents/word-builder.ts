import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { DokumenData, Kolom, Sel } from "./types";

const NAVY = "0B2545";
const SOFT = "EEF3F9";
const LINE = "D8DEE6";
const MUTED = "5B6675";
const FONT = "Calibri";
const MAX_ROWS = 200;

function show(value: Sel, kolom: Kolom) {
  if (value === null || value === undefined) return "";
  if (kolom.format === "rupiah") return formatRupiah(Number(value));
  if (kolom.format === "tanggal") return formatTanggal(String(value));
  if (kolom.format === "desimal") return Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return String(value);
}

const edge = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: edge, bottom: edge, left: edge, right: edge };

function cell(text: string, options: { bold?: boolean; fill?: string; right?: boolean; width: number }) {
  return new TableCell({
    width: { size: options.width, type: WidthType.PERCENTAGE },
    borders,
    shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: options.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: options.bold, font: FONT, size: 20, color: options.bold ? NAVY : "1B2430" })],
      }),
    ],
  });
}

const heading = (text: string) =>
  new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: FONT, size: 28, color: NAVY })],
  });

const body = (text: string, color = "1B2430") =>
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, font: FONT, size: 22, color })] });

/** Builds a report: title, summary table, one table per sheet, conclusion, and a data note in the footer. */
export async function bangunWord(data: DokumenData): Promise<Buffer> {
  const note = `Sumber data: database Pemkot-AI (${data.sumber}), ${formatTanggal(data.dibuat)}. Data fiktif untuk demo.`;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: data.judul, bold: true, font: FONT, size: 40, color: NAVY })],
    }),
    body(data.subjudul, MUTED),
    body(`Dibuat ${formatTanggal(data.dibuat)}`, MUTED),
  ];

  if (data.ringkasan.length) {
    children.push(heading("Ringkasan"));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: data.ringkasan.map(
          (item) =>
            new TableRow({
              children: [cell(item.label, { bold: true, fill: SOFT, width: 35 }), cell(item.nilai, { width: 65 })],
            }),
        ),
      }),
    );
  }

  for (const lembar of data.lembar) {
    children.push(heading(lembar.nama));
    if (lembar.baris.length === 0) {
      children.push(body("Tidak ada data.", MUTED));
      continue;
    }
    const shown = lembar.baris.slice(0, MAX_ROWS);
    const numberWidth = 5;
    const width = (100 - numberWidth) / lembar.kolom.length;
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              cell("No", { bold: true, fill: SOFT, width: numberWidth, right: true }),
              ...lembar.kolom.map((kolom) => cell(kolom.header, { bold: true, fill: SOFT, width })),
            ],
          }),
          ...shown.map(
            (baris, index) =>
              new TableRow({
                children: [
                  cell(String(index + 1), { width: numberWidth, right: true }),
                  ...lembar.kolom.map((kolom) =>
                    cell(show(baris[kolom.key] ?? null, kolom), {
                      width,
                      right: Boolean(kolom.format && kolom.format !== "teks" && kolom.format !== "tanggal"),
                    }),
                  ),
                ],
              }),
          ),
        ],
      }),
    );
    if (lembar.baris.length > MAX_ROWS) {
      children.push(body(`Menampilkan ${MAX_ROWS} dari ${lembar.baris.length} baris.`, MUTED));
    }
  }

  children.push(heading("Kesimpulan"));
  for (const item of data.kesimpulan) {
    children.push(
      new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: item, font: FONT, size: 22 })] }),
    );
  }

  const wide = data.lembar.some((item) => item.kolom.length > 6);
  const document = new Document({
    creator: "Pemkot-AI (demo)",
    title: data.judul,
    sections: [
      {
        properties: { page: { size: { orientation: wide ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT } } },
        footers: {
          default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: note, font: FONT, size: 18, color: MUTED })] })] }),
        },
        children,
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(document));
}
