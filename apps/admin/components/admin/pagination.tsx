import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  hrefForPage,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1) as Route}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Previous
          </Link>
        ) : (
          <span
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            Previous
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={hrefForPage(page + 1) as Route}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next
          </Link>
        ) : (
          <span
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            Next
          </span>
        )}
      </div>
    </div>
  );
}
