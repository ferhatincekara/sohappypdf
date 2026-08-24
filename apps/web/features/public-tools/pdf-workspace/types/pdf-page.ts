export type PdfPageRotation = 0 | 90 | 180 | 270;

export type PdfPage = {
  id: string;
  pageIndex: number;
  pageNumber: number;
  selected: boolean;
  rotation: PdfPageRotation;
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
      id: `page-${pageNumber}`,
      pageIndex,
      pageNumber,
      selected: selected.has(pageNumber),
      rotation: 0,
    };
  });
}
