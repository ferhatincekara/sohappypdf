export function convertHintKey(
  toolId: string,
):
  | "excelHint"
  | "wordOcrHint"
  | "pdfaHint"
  | "imageHint"
  | "textHint"
  | "hint" {
  switch (toolId) {
    case "pdf-to-excel":
    case "pdf-to-excel-ocr":
      return "excelHint";
    case "pdf-to-word-ocr":
      return "wordOcrHint";
    case "pdf-to-pdfa":
      return "pdfaHint";
    case "jpg-to-pdf":
    case "png-to-pdf":
      return "imageHint";
    case "pdf-to-txt":
    case "pdf-to-markdown":
      return "textHint";
    default:
      return "hint";
  }
}
