"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { GlobalSearchResult } from "@/lib/services/global-search";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setError("Masukkan minimal 2 karakter.");
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("search_failed");
      const data = (await response.json()) as { results: GlobalSearchResult[] };
      setResults(data.results);
    } catch {
      setResults([]);
      setError("Pencarian tidak tersedia. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative min-w-0 w-full md:w-96">
      <form onSubmit={search}>
        <label className="sr-only" htmlFor="global-search">Cari vendor atau proyek</label>
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length || error) setOpen(true);
          }}
          maxLength={80}
          placeholder="Cari vendor atau proyek"
          className="h-11 w-full rounded-md border border-line bg-surface px-3 pr-12 text-table text-text placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Cari"
          title="Cari"
          disabled={loading}
          className="absolute inset-y-0 right-0 inline-flex size-11 items-center justify-center rounded-r-md text-primary hover:bg-primary-soft disabled:cursor-not-allowed"
        >
          <Search aria-hidden className="size-4" />
        </button>
      </form>

      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-line bg-surface shadow-lg"
        >
          {loading ? (
            <p role="status" className="px-3 py-3 text-table text-muted">Mencari...</p>
          ) : error ? (
            <p role="alert" className="px-3 py-3 text-table text-bad">{error}</p>
          ) : results.length ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={() => setOpen(false)}
                    className="block min-h-11 border-b border-line px-3 py-2 last:border-b-0 hover:bg-primary-soft"
                  >
                    <span className="block truncate text-table font-medium text-text">{result.label}</span>
                    <span className="block truncate text-caption text-muted">
                      {result.kind} · {result.detail}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="px-3 py-3 text-table text-muted">Tidak ada hasil yang sesuai.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
