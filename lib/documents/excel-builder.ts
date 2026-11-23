import ExcelJS from "exceljs";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { DokumenData, Format, Sel } from "./types";

const NAVY = "FF0B2545";
const SOFT = "FFEEF3F9";
const LINE = "FFD8DEE6";
const MUTED = "FF5B6675";

const NUM_FMT: Record<Format, string | undefined> = {
  teks: undefined,
  angka: "#,##0",
  desimal: "0.0",
  rupiah: '"Rp" #,##0',
  tanggal: "d mmm yyyy",
};

const border = { style: "thin" as const, color: { argb: LINE } };

function cellValue(value: Sel, format: Format | undefined) {
  if (value === null || value === undefined) return null;
  if (format === "tanggal" && typeof value === "string") {
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}

function textOf(value: Sel, format: Format | undefined) {
  if (value === null || value === undefined) return "";
  if (format === "rupiah") return formatRupiah(Number(value));
  if (format === "tanggal") return formatTanggal(String(value));
  return String(value);
}

/** Builds the workbook: title block, header row with filter, rows, and widths that fit the content. */
export async function bangunExcel(data: DokumenData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Pemkot-AI (demo)";
  workbook.created = new Date();
  workbook.title = data.judul;

  data.lembar.forEach((lembar, sheetIndex) => {
    const sheet = workbook.addWorksheet(lembar.nama.slice(0, 31), {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    const columns = lembar.kolom.length;

    sheet.getCell("A1").value = data.judul;
    sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: NAVY } };
    sheet.getCell("A2").value = data.subjudul;
    sheet.getCell("A2").font = { color: { argb: MUTED } };
    sheet.getCell("A3").value = `Dibuat ${formatTanggal(data.dibuat)}. Sumber data: database Pemkot-AI (${data.sumber}). Data fiktif untuk demo.`;
    sheet.getCell("A3").font = { size: 10, color: { argb: MUTED } };

    let row = 5;
    if (sheetIndex === 0) {
      for (const item of data.ringkasan) {
        sheet.getCell(row, 1).value = item.label;
        sheet.getCell(row, 1).font = { bold: true };
        sheet.getCell(row, 2).value = item.nilai;
        row += 1;
      }
      if (data.ringkasan.length) row += 1;
    }

    const headerRow = row;
    lembar.kolom.forEach((kolom, index) => {
      const cell = sheet.getCell(headerRow, index + 1);
      cell.value = kolom.header;
      cell.font = { bold: true, color: { argb: NAVY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { top: border, bottom: border, left: border, right: border };
    });

    lembar.baris.forEach((baris, rowIndex) => {
      lembar.kolom.forEach((kolom, index) => {
        const cell = sheet.getCell(headerRow + 1 + rowIndex, index + 1);
        cell.value = cellValue(baris[kolom.key] ?? null, kolom.format);
        const numFmt = NUM_FMT[kolom.format ?? "teks"];
        if (numFmt) cell.numFmt = numFmt;
        cell.alignment = {
          vertical: "top",
          wrapText: true,
          horizontal: kolom.format && kolom.format !== "teks" && kolom.format !== "tanggal" ? "right" : "left",
        };
        cell.border = { top: border, bottom: border, left: border, right: border };
      });
    });

    lembar.kolom.forEach((kolom, index) => {
      const longest = Math.max(
        kolom.header.length,
        ...lembar.baris.map((baris) => textOf(baris[kolom.key] ?? null, kolom.format).length),
      );
      sheet.getColumn(index + 1).width = Math.min(Math.max(longest + 3, 10), 60);
    });
    // The title block shares column A and B with the table, so keep them wide enough to read.
    sheet.getColumn(1).width = Math.max(sheet.getColumn(1).width ?? 10, 18);

    if (lembar.baris.length > 0) {
      sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: columns } };
    }
    sheet.views = [{ state: "frozen", ySplit: headerRow }];
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
