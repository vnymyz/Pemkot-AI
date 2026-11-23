import PptxGenJS from "pptxgenjs";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { JUMLAH_SLIDE, type DokumenData, type Kolom, type Sel } from "./types";

// Palette from the design tokens in app/globals.css (hex without #).
const NAVY = "0B2545";
const PRIMARY = "1B4F8C";
const SOFT = "EEF3F9";
const LINE = "D8DEE6";
const TEXT = "1B2430";
const MUTED = "5B6675";
const GOLD = "E8B94A";
const FONT = "Calibri";
const TABLE_ROWS = 8;
const TABLE_COLUMNS = 6;

function show(value: Sel, kolom: Kolom) {
  if (value === null || value === undefined) return "";
  if (kolom.format === "rupiah") return formatRupiah(Number(value));
  if (kolom.format === "tanggal") return formatTanggal(String(value));
  if (kolom.format === "desimal") return Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return String(value);
}

function footer(slide: PptxGenJS.Slide, text: string) {
  slide.addText(text, { x: 0.5, y: 7.05, w: 12.3, h: 0.3, fontFace: FONT, fontSize: 10, color: MUTED });
}

/** Builds exactly JUMLAH_SLIDE slides: title, summary, table, chart or key points, conclusion. */
export async function bangunPowerPoint(data: DokumenData): Promise<{ buffer: Buffer; slide: number }> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.title = data.judul;
  pptx.author = "Pemkot-AI (demo)";
  const note = `Sumber data: database Pemkot-AI (${data.sumber}), ${formatTanggal(data.dibuat)}. Data fiktif untuk demo.`;

  // 1. Title
  const title = pptx.addSlide();
  title.background = { color: NAVY };
  title.addShape("rect", { x: 0.6, y: 2.6, w: 0.12, h: 1.6, fill: { color: GOLD }, line: { color: GOLD } });
  title.addText(data.judul, { x: 1.0, y: 2.4, w: 11.5, h: 1.2, fontFace: FONT, fontSize: 36, bold: true, color: "FFFFFF", valign: "top" });
  title.addText(data.subjudul, { x: 1.0, y: 3.7, w: 11.5, h: 0.6, fontFace: FONT, fontSize: 18, color: "FFFFFF" });
  title.addText(`Pemerintah Kota, ${formatTanggal(data.dibuat)}`, { x: 1.0, y: 6.6, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 12, color: "FFFFFF" });

  // 2. Summary
  const summary = pptx.addSlide();
  summary.addText("Ringkasan", { x: 0.5, y: 0.4, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
  data.ringkasan.slice(0, 6).forEach((item, index) => {
    const column = index % 2;
    const rowIndex = Math.floor(index / 2);
    const x = 0.5 + column * 6.3;
    const y = 1.4 + rowIndex * 1.6;
    summary.addShape("rect", { x, y, w: 6.0, h: 1.4, fill: { color: SOFT }, line: { color: LINE } });
    summary.addText(item.label, { x: x + 0.2, y: y + 0.1, w: 5.6, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED });
    summary.addText(item.nilai, { x: x + 0.2, y: y + 0.5, w: 5.6, h: 0.8, fontFace: FONT, fontSize: 20, bold: true, color: NAVY, valign: "top" });
  });
  footer(summary, note);

  // 3. Table of the first sheet
  const lembar = data.lembar[0];
  const kolom = lembar.kolom.slice(0, TABLE_COLUMNS);
  const table = pptx.addSlide();
  table.addText(lembar.nama, { x: 0.5, y: 0.4, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
  if (lembar.baris.length === 0) {
    table.addText("Tidak ada data untuk ditampilkan.", { x: 0.5, y: 1.4, w: 12.3, h: 0.6, fontFace: FONT, fontSize: 16, color: MUTED });
  } else {
    const header = kolom.map((item) => ({
      text: item.header,
      options: { bold: true, color: NAVY, fill: { color: SOFT }, fontFace: FONT, fontSize: 12 },
    }));
    const body = lembar.baris.slice(0, TABLE_ROWS).map((baris) =>
      kolom.map((item) => ({
        text: show(baris[item.key] ?? null, item),
        options: {
          color: TEXT,
          fontFace: FONT,
          fontSize: 12,
          align: item.format && item.format !== "teks" && item.format !== "tanggal" ? ("right" as const) : ("left" as const),
        },
      })),
    );
    table.addTable([header, ...body], { x: 0.5, y: 1.3, w: 12.3, border: { type: "solid", color: LINE, pt: 0.75 }, valign: "middle", rowH: 0.5 });
    if (lembar.baris.length > TABLE_ROWS) {
      table.addText(`Menampilkan ${TABLE_ROWS} dari ${lembar.baris.length} baris. Data lengkap ada di file Excel.`, {
        x: 0.5, y: 6.6, w: 12.3, h: 0.35, fontFace: FONT, fontSize: 11, color: MUTED,
      });
    }
  }
  footer(table, note);

  // 4. Chart or key points
  const middle = pptx.addSlide();
  if (data.grafik && data.grafik.nilai.length > 0) {
    middle.addText(data.grafik.judul, { x: 0.5, y: 0.4, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
    middle.addChart(
      "bar",
      // Horizontal bars draw the first category at the bottom, so the order is reversed to keep rank 1 on top.
      [{ name: "Skor", labels: [...data.grafik.label].reverse(), values: [...data.grafik.nilai].reverse() }],
      {
        x: 0.8, y: 1.3, w: 11.7, h: 5.4, barDir: "bar", chartColors: [PRIMARY],
        valAxisMinVal: 0, valAxisMaxVal: data.grafik.maks, valGridLine: { color: LINE, size: 0.5 },
        catAxisLabelFontFace: FONT, catAxisLabelFontSize: 14, catAxisLabelColor: TEXT,
        valAxisLabelFontFace: FONT, valAxisLabelFontSize: 12, valAxisLabelColor: MUTED,
        showValue: true, dataLabelFontFace: FONT, dataLabelFontSize: 14, dataLabelColor: TEXT,
        showLegend: false,
      },
    );
  } else {
    middle.addText("Poin penting", { x: 0.5, y: 0.4, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
    middle.addText(
      data.ringkasan.map((item) => ({ text: `${item.label}: ${item.nilai}`, options: { bullet: true, breakLine: true } })),
      { x: 0.8, y: 1.4, w: 11.7, h: 5.2, fontFace: FONT, fontSize: 20, color: TEXT, valign: "top", paraSpaceAfter: 10 },
    );
  }
  footer(middle, note);

  // 5. Conclusion
  const end = pptx.addSlide();
  end.addText("Kesimpulan", { x: 0.5, y: 0.4, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
  end.addText(
    data.kesimpulan.map((line) => ({ text: line, options: { bullet: true, breakLine: true } })),
    { x: 0.8, y: 1.4, w: 11.7, h: 4.4, fontFace: FONT, fontSize: 20, color: TEXT, valign: "top", paraSpaceAfter: 12 },
  );
  end.addShape("rect", { x: 0.5, y: 5.9, w: 12.3, h: 0.9, fill: { color: SOFT }, line: { color: LINE } });
  end.addText(note, { x: 0.7, y: 5.95, w: 11.9, h: 0.8, fontFace: FONT, fontSize: 12, color: MUTED, valign: "middle" });

  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return { buffer: Buffer.from(output), slide: JUMLAH_SLIDE };
}
