import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  href,
  emptyTitle,
  emptyDescription,
}: {
  columns: ReadonlyArray<DataTableColumn<T>>;
  rows: readonly T[];
  rowKey: (row: T) => string;
  href?: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="-mx-4 overflow-x-auto border-y border-border bg-card sm:mx-0 sm:rounded-xl sm:border sm:shadow-sm">
      <table className="w-full min-w-160 border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  "px-3 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const destination = href?.(row);

            return (
              <tr
                key={rowKey(row)}
                className="relative border-b border-border last:border-0 hover:bg-muted/60"
              >
                {columns.map((column, index) => (
                  <td
                    key={column.id}
                    className={cn("px-3 py-2 align-middle", column.className)}
                  >
                    {index === 0 && destination !== undefined ? (
                      <Link
                        href={destination as Route}
                        className="font-medium text-foreground after:absolute after:inset-0 hover:underline"
                      >
                        {column.cell(row)}
                      </Link>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
