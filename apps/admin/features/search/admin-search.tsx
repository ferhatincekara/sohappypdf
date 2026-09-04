"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchAdminAction } from "@/server/actions/search";
import type { AdminSearchResult } from "@/server/query/search";

export function AdminSearch() {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();
  const open = trimmed.length >= 2;

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setPending(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setPending(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void searchAdminAction(trimmed)
        .then((next) => {
          if (!cancelled) {
            setResults(next);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setError("Search failed. Try again.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPending(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onValueChange={setQuery}
        placeholder="Search users, tools, executions…"
        aria-label="Admin search"
        aria-expanded={open}
        aria-controls={listId}
        className="h-9 bg-background pl-9 shadow-none"
      />
      {open ? (
        <div
          id={listId}
          className="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
        >
          {pending ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              Searching…
            </p>
          ) : null}
          {error !== null ? (
            <p className="px-3 py-2.5 text-sm text-destructive">{error}</p>
          ) : null}
          {!pending && error === null && results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              No matches for “{trimmed}”.
            </p>
          ) : null}
          {results.map((result) => (
            <Link
              key={`${result.kind}-${result.id}`}
              href={result.href as Route}
              className="block px-3 py-2 text-sm no-underline hover:bg-accent"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
            >
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {result.kind}
              </span>
              <span className="ml-2 text-foreground">{result.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
