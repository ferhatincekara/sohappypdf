export {
  DocumentEditor,
  type EditorPdfSource,
} from "./components/document-editor";
export { useDocumentEditor } from "./hooks/use-document-editor";
export {
  createRectangleObject,
  createSignatureObject,
  createTextObject,
} from "./lib/create-editor-object";
export {
  type DocumentEditorAction,
  type DocumentEditorState,
  documentEditorReducer,
  INITIAL_DOCUMENT_EDITOR_STATE,
  objectsOnPage,
  selectedEditorObject,
} from "./lib/document-editor-state";
export { editorRectToPdf, pdfRectToEditor } from "./lib/page-coordinates";
export type {
  EditorObject,
  EditorTool,
} from "./types/editor-object";
