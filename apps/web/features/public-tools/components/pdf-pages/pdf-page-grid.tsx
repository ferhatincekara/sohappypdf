"use client";

import type { PdfjsDocument } from "../../lib/pdfjs-client";
import { PdfPageThumbnail } from "./pdf-page-thumbnail";

export function PdfPageGrid({
  document,
  pageCount,
  selectedPages,
  disabled,
  onToggle,
}: {
  document: PdfjsDocument;
  pageCount: number;
  selectedPages: readonly number[];
  disabled: boolean;
  onToggle: (page: number) => void;
}) {
  const selected = new Set(selectedPages);

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: pageCount }, (_, index) => {
        const pageNumber = index + 1;
        return (
          <li key={pageNumber}>
            <PdfPageThumbnail
              document={document}
              pageNumber={pageNumber}
              selected={selected.has(pageNumber)}
              disabled={disabled}
              onToggle={() => {
                onToggle(pageNumber);
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}
