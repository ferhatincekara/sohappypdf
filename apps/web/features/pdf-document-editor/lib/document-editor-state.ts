import type {
  EditorObject,
  EditorTool,
} from "@/features/pdf-document-editor/types/editor-object";

export const MIN_EDITOR_ZOOM = 0.5;
export const MAX_EDITOR_ZOOM = 3;
export const DEFAULT_EDITOR_ZOOM = 1;

export type EditorSnapshot = {
  objects: readonly EditorObject[];
  selectedId: string | null;
};

export type DocumentEditorState = {
  pageCount: number;
  currentPage: number;
  zoom: number;
  panX: number;
  panY: number;
  tool: EditorTool;
  objects: readonly EditorObject[];
  selectedId: string | null;
  past: readonly EditorSnapshot[];
  future: readonly EditorSnapshot[];
};

export const INITIAL_DOCUMENT_EDITOR_STATE: DocumentEditorState = {
  pageCount: 1,
  currentPage: 1,
  zoom: DEFAULT_EDITOR_ZOOM,
  panX: 0,
  panY: 0,
  tool: "select",
  objects: [],
  selectedId: null,
  past: [],
  future: [],
};

export type DocumentEditorAction =
  | { type: "setPageCount"; pageCount: number }
  | { type: "setCurrentPage"; page: number }
  | { type: "setZoom"; zoom: number }
  | { type: "setPan"; panX: number; panY: number }
  | { type: "setTool"; tool: EditorTool }
  | { type: "select"; id: string | null }
  | { type: "loadObjects"; objects: readonly EditorObject[] }
  | { type: "addObject"; object: EditorObject }
  | { type: "updateObject"; id: string; object: EditorObject }
  | { type: "replaceObject"; object: EditorObject }
  | { type: "deleteSelected" }
  | { type: "undo" }
  | { type: "redo" };

function snapshotOf(state: DocumentEditorState): EditorSnapshot {
  return {
    objects: state.objects,
    selectedId: state.selectedId,
  };
}

function withHistory(
  state: DocumentEditorState,
  next: Pick<DocumentEditorState, "objects" | "selectedId">,
): DocumentEditorState {
  return {
    ...state,
    ...next,
    past: [...state.past, snapshotOf(state)],
    future: [],
  };
}

function clampPage(page: number, pageCount: number): number {
  return Math.min(pageCount, Math.max(1, page));
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_EDITOR_ZOOM, Math.max(MIN_EDITOR_ZOOM, zoom));
}

export function documentEditorReducer(
  state: DocumentEditorState,
  action: DocumentEditorAction,
): DocumentEditorState {
  switch (action.type) {
    case "setPageCount": {
      const pageCount = Math.max(1, Math.floor(action.pageCount));
      return {
        ...state,
        pageCount,
        currentPage: clampPage(state.currentPage, pageCount),
      };
    }
    case "setCurrentPage":
      return {
        ...state,
        currentPage: clampPage(action.page, state.pageCount),
        selectedId: null,
      };
    case "setZoom":
      return { ...state, zoom: clampZoom(action.zoom) };
    case "setPan":
      return { ...state, panX: action.panX, panY: action.panY };
    case "setTool":
      return { ...state, tool: action.tool };
    case "select":
      return { ...state, selectedId: action.id, tool: "select" };
    case "loadObjects":
      return {
        ...state,
        objects: action.objects,
        selectedId: null,
        past: [],
        future: [],
      };
    case "addObject":
      return withHistory(state, {
        objects: [...state.objects, action.object],
        selectedId: action.object.id,
      });
    case "updateObject": {
      const current = state.objects.find((item) => item.id === action.id);

      if (current === undefined) {
        return state;
      }

      return withHistory(state, {
        objects: state.objects.map((item) =>
          item.id === action.id ? action.object : item,
        ),
        selectedId: action.id,
      });
    }
    case "replaceObject":
      return {
        ...state,
        objects: state.objects.map((item) =>
          item.id === action.object.id ? action.object : item,
        ),
        selectedId: action.object.id,
      };
    case "deleteSelected": {
      if (state.selectedId === null) {
        return state;
      }

      return withHistory(state, {
        objects: state.objects.filter(
          (object) => object.id !== state.selectedId,
        ),
        selectedId: null,
      });
    }
    case "undo": {
      const previous = state.past[state.past.length - 1];

      if (previous === undefined) {
        return state;
      }

      return {
        ...state,
        objects: previous.objects,
        selectedId: previous.selectedId,
        past: state.past.slice(0, -1),
        future: [snapshotOf(state), ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];

      if (next === undefined) {
        return state;
      }

      return {
        ...state,
        objects: next.objects,
        selectedId: next.selectedId,
        past: [...state.past, snapshotOf(state)],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

export function selectedEditorObject(
  state: DocumentEditorState,
): EditorObject | null {
  if (state.selectedId === null) {
    return null;
  }

  return state.objects.find((object) => object.id === state.selectedId) ?? null;
}

export function objectsOnPage(
  objects: readonly EditorObject[],
  page: number,
): EditorObject[] {
  return objects.filter((object) => object.page === page);
}
