export const PAGE_SIZE = 10;

export type Paged<T> = {
  rows: T[];
  page: number;
  totalPages: number;
  total: number;
  /** Row number of the first row on this page, starting from 1. */
  start: number;
  end: number;
};

export function paginate<T>(items: T[], rawPage: string | string[] | undefined, size = PAGE_SIZE): Paged<T> {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / size), 1);
  const requested = typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), totalPages) : 1;
  const offset = (page - 1) * size;
  const rows = items.slice(offset, offset + size);
  return { rows, page, totalPages, total, start: total ? offset + 1 : 0, end: offset + rows.length };
}
