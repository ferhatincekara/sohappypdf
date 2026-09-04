"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { AdminSearchResult } from "@/server/query/search";

export function AdminSearch({
  search,
}: {
  search: (query: string) => Promise<AdminSearchResult[]>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void search(query).then(setResults);
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, search]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search users, executions, sessions, tools"
        aria-label="Admin search"
        className="h-10 pr-3 pl-9 sm:h-9"
      />
      {results.length > 0 ? (
        <div className="absolute top-full z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {results.map((result) => (
            <Link
              key={`${result.kind}-${result.id}`}
              href={result.href as Route}
              className="block px-3 py-2.5 text-sm no-underline hover:bg-muted"
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
