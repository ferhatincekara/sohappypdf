"use client";

import { useEffect, useReducer } from "react";
import {
  documentEditorReducer,
  INITIAL_DOCUMENT_EDITOR_STATE,
  selectedEditorObject,
} from "../lib/document-editor-state";

export function useDocumentEditor(pageCount: number) {
  const [state, dispatch] = useReducer(
    documentEditorReducer,
    INITIAL_DOCUMENT_EDITOR_STATE,
  );

  useEffect(() => {
    dispatch({ type: "setPageCount", pageCount: Math.max(1, pageCount) });
  }, [pageCount]);

  return {
    state,
    dispatch,
    selected: selectedEditorObject(state),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
