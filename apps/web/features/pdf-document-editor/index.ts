export {
  DocumentEditor,
  type EditorPdfSource,
} from "@/features/pdf-document-editor/components/document-editor";
export { useDocumentEditor } from "@/features/pdf-document-editor/hooks/use-document-editor";
export {
  createImageObject,
  createRectangleObject,
  createSignatureObject,
  createTextObject,
} from "@/features/pdf-document-editor/lib/create-editor-object";
export {
  type DocumentEditorAction,
  type DocumentEditorState,
  documentEditorReducer,
  INITIAL_DOCUMENT_EDITOR_STATE,
  objectsOnPage,
  selectedEditorObject,
} from "@/features/pdf-document-editor/lib/document-editor-state";
export {
  zoomToFitPage,
  zoomToFitWidth,
} from "@/features/pdf-document-editor/lib/editor-zoom";
export {
  editorRectToPdf,
  pdfRectToEditor,
} from "@/features/pdf-document-editor/lib/page-coordinates";
export type {
  EditorObject,
  EditorTool,
} from "@/features/pdf-document-editor/types/editor-object";
