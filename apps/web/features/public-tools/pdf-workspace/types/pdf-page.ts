export type PdfPage = {
  pageIndex: number;
  pageNumber: number;
  selected: boolean;
};

export function createPdfPages(
  pageCount: number,
  selectedPages: readonly number[],
): PdfPage[] {
  if (pageCount < 1) {
    return [];
  }

  const selected = new Set(selectedPages);

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const pageNumber = pageIndex + 1;
    return {
      pageIndex,
      pageNumber,
      selected: selected.has(pageNumber),
    };
  });
}
