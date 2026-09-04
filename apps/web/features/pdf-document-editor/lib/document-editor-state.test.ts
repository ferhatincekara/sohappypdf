import { describe, expect, test } from "bun:test";
import {
  documentEditorReducer,
  INITIAL_DOCUMENT_EDITOR_STATE,
  selectedEditorObject,
} from "@/features/pdf-document-editor/lib/document-editor-state";
import type { EditorTextObject } from "@/features/pdf-document-editor/types/editor-object";

const sampleText = (id: string): EditorTextObject => ({
  id,
  kind: "text",
  page: 1,
  x: 40,
  y: 40,
  width: 160,
  height: 28,
  rotation: 0,
  text: "Hello",
  fontSize: 16,
});

describe("documentEditorReducer", () => {
  test("adds, selects, moves, and deletes objects with undo and redo", () => {
    const added = documentEditorReducer(INITIAL_DOCUMENT_EDITOR_STATE, {
      type: "addObject",
      object: sampleText("a"),
    });
    expect(added.objects).toHaveLength(1);
    expect(added.selectedId).toBe("a");

    const moved = documentEditorReducer(added, {
      type: "updateObject",
      id: "a",
      object: { ...sampleText("a"), x: 80 },
    });
    expect(selectedEditorObject(moved)?.x).toBe(80);

    const undone = documentEditorReducer(moved, { type: "undo" });
    expect(selectedEditorObject(undone)?.x).toBe(40);

    const redone = documentEditorReducer(undone, { type: "redo" });
    expect(selectedEditorObject(redone)?.x).toBe(80);

    const deleted = documentEditorReducer(redone, { type: "deleteSelected" });
    expect(deleted.objects).toHaveLength(0);
    expect(deleted.selectedId).toBeNull();
  });

  test("loadObjects replaces the canvas and clears history", () => {
    const added = documentEditorReducer(INITIAL_DOCUMENT_EDITOR_STATE, {
      type: "addObject",
      object: sampleText("a"),
    });
    const loaded = documentEditorReducer(added, {
      type: "loadObjects",
      objects: [sampleText("b")],
    });

    expect(loaded.objects.map((object) => object.id)).toEqual(["b"]);
    expect(loaded.selectedId).toBeNull();
    expect(loaded.past).toEqual([]);
    expect(loaded.future).toEqual([]);
  });

  test("clamps zoom and page navigation", () => {
    const paged = documentEditorReducer(INITIAL_DOCUMENT_EDITOR_STATE, {
      type: "setPageCount",
      pageCount: 3,
    });
    expect(
      documentEditorReducer(paged, { type: "setCurrentPage", page: 9 })
        .currentPage,
    ).toBe(3);
    expect(
      documentEditorReducer(paged, { type: "setZoom", zoom: 10 }).zoom,
    ).toBe(3);
  });
});
