export const EDITOR_OBJECT_KINDS = [
  "text",
  "image",
  "rectangle",
  "signature",
] as const;

export type EditorObjectKind = (typeof EDITOR_OBJECT_KINDS)[number];

export type EditorObjectBase = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type EditorTextObject = EditorObjectBase & {
  kind: "text";
  text: string;
  fontSize: number;
};

export type EditorImageObject = EditorObjectBase & {
  kind: "image";
  src: string;
};

export type EditorRectangleObject = EditorObjectBase & {
  kind: "rectangle";
  style: "fill" | "highlight";
};

export type EditorSignatureObject = EditorObjectBase & {
  kind: "signature";
  src?: string;
  text?: string;
};

export type EditorObject =
  | EditorTextObject
  | EditorImageObject
  | EditorRectangleObject
  | EditorSignatureObject;

export const EDITOR_TOOLS = [
  "select",
  "text",
  "image",
  "shape",
  "signature",
] as const;

export type EditorTool = (typeof EDITOR_TOOLS)[number];
