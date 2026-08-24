export function editorRectToPdf(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  pageHeight: number;
}): { x: number; y: number; width: number; height: number } {
  return {
    x: input.x,
    y: input.pageHeight - input.y - input.height,
    width: input.width,
    height: input.height,
  };
}

export function pdfRectToEditor(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  pageHeight: number;
}): { x: number; y: number; width: number; height: number } {
  return {
    x: input.x,
    y: input.pageHeight - input.y - input.height,
    width: input.width,
    height: input.height,
  };
}
