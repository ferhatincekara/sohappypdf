import type {
  EditorImageObject,
  EditorRectangleObject,
  EditorSignatureObject,
  EditorTextObject,
} from "@/features/pdf-document-editor/types/editor-object";

export function createEditorId(): string {
  return crypto.randomUUID();
}

export function createTextObject(input: {
  page: number;
  x: number;
  y: number;
  text?: string;
}): EditorTextObject {
  return {
    id: createEditorId(),
    kind: "text",
    page: input.page,
    x: input.x,
    y: input.y,
    width: 180,
    height: 32,
    rotation: 0,
    text: input.text ?? "Text",
    fontSize: 16,
  };
}

export function createRectangleObject(input: {
  page: number;
  x: number;
  y: number;
  style?: EditorRectangleObject["style"];
}): EditorRectangleObject {
  return {
    id: createEditorId(),
    kind: "rectangle",
    page: input.page,
    x: input.x,
    y: input.y,
    width: 160,
    height: 36,
    rotation: 0,
    style: input.style ?? "highlight",
  };
}

export function createSignatureObject(input: {
  page: number;
  x: number;
  y: number;
  src?: string;
  text?: string;
}): EditorSignatureObject {
  return {
    id: createEditorId(),
    kind: "signature",
    page: input.page,
    x: input.x,
    y: input.y,
    width: 180,
    height: 64,
    rotation: 0,
    src: input.src,
    text: input.text,
  };
}

export function createImageObject(input: {
  page: number;
  x: number;
  y: number;
  src: string;
}): EditorImageObject {
  return {
    id: createEditorId(),
    kind: "image",
    page: input.page,
    x: input.x,
    y: input.y,
    width: 160,
    height: 120,
    rotation: 0,
    src: input.src,
  };
}
