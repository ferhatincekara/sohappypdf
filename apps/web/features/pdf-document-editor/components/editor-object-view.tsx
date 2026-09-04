"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type {
  EditorObject,
  EditorTextObject,
} from "@/features/pdf-document-editor/types/editor-object";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 4;

function isUnchangedOriginal(object: EditorTextObject): boolean {
  const origin = object.origin;

  if (object.source !== "original" || origin === undefined) {
    return false;
  }

  return (
    object.text === origin.text &&
    Math.round(object.x) === Math.round(origin.x) &&
    Math.round(object.y) === Math.round(origin.y) &&
    Math.round(object.fontSize) === Math.round(origin.fontSize)
  );
}

function textVisualStyle(
  object: EditorTextObject,
  scale: number,
  reveal: boolean,
) {
  const family = object.fontFamily ?? "Arial";
  const bold = /bold/i.test(family);
  const hidden = isUnchangedOriginal(object) && !reveal;

  return {
    fontSize: `${object.fontSize * scale}px`,
    fontFamily: family.replace(/\s+Bold$/i, ""),
    fontWeight: bold ? 700 : 400,
    color: hidden ? "transparent" : (object.color ?? "#111111"),
    backgroundColor:
      hidden || object.source !== "original" ? "transparent" : "#ffffff",
    boxShadow:
      hidden || object.source !== "original" ? undefined : "0 0 0 2px #ffffff",
  } as const;
}

export function EditorObjectView({
  object,
  selected,
  scale,
  disabled,
  onSelect,
  onMove,
  onResize,
  onTextChange,
}: {
  object: EditorObject;
  selected: boolean;
  scale: number;
  disabled: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  onTextChange?: (text: string) => void;
}) {
  const t = useTranslations("publicTools.editor");
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
  } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const skipCommitRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (editing) {
      textRef.current?.focus();
      textRef.current?.select();
    }
  }, [editing]);

  function startTextEdit(): void {
    if (object.kind !== "text" || disabled || onTextChange === undefined) {
      return;
    }

    dragRef.current = null;
    onSelect();
    setDraft(object.kind === "text" ? object.text : "");
    setEditing(true);
  }

  const textObject = object.kind === "text" ? object : null;

  return (
    <div
      className={cn(
        "absolute outline-none",
        selected ? "ring-2 ring-foreground" : "ring-1 ring-transparent",
        !selected && !editing && !disabled
          ? "hover:ring-foreground/30"
          : undefined,
      )}
      style={{
        left: object.x * scale,
        top: object.y * scale,
        width: object.width * scale,
        height: object.height * scale,
        transform:
          object.rotation === 0 ? undefined : `rotate(${object.rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      {textObject !== null && editing ? (
        <textarea
          ref={textRef}
          aria-label={t("text")}
          value={draft}
          className="h-full w-full resize-none overflow-hidden border-0 bg-transparent px-0.5 leading-tight outline-none"
          style={textVisualStyle(textObject, scale, true)}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onChange={(event) => {
            setDraft(event.target.value.replace(/\n+/g, " "));
          }}
          onBlur={() => {
            if (!skipCommitRef.current) {
              onTextChange?.(draft);
            }
            skipCommitRef.current = false;
            setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              skipCommitRef.current = true;
              event.currentTarget.blur();
            }
          }}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={selected}
          aria-label={t(`objects.${object.kind}`)}
          onDoubleClick={(event) => {
            event.stopPropagation();
            startTextEdit();
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            onSelect();
            dragRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              originX: object.x,
              originY: object.y,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;

            if (drag === null) {
              return;
            }

            const distance = Math.hypot(
              event.clientX - drag.startX,
              event.clientY - drag.startY,
            );

            if (!drag.moved && distance < DRAG_THRESHOLD_PX) {
              return;
            }

            drag.moved = true;
            onMove(
              drag.originX + (event.clientX - drag.startX) / scale,
              drag.originY + (event.clientY - drag.startY) / scale,
            );
          }}
          onPointerUp={() => {
            const drag = dragRef.current;
            dragRef.current = null;

            if (
              drag !== null &&
              !drag.moved &&
              selected &&
              object.kind === "text"
            ) {
              startTextEdit();
            }
          }}
          className={cn(
            "block h-full w-full overflow-hidden text-left",
            object.kind === "text" ? "cursor-text" : undefined,
          )}
        >
          {textObject !== null ? (
            <span
              className="block h-full w-full overflow-hidden px-0.5 leading-tight"
              style={textVisualStyle(textObject, scale, selected)}
            >
              {textObject.text}
            </span>
          ) : null}
          {object.kind === "signature" && object.src === undefined ? (
            <span className="block h-full w-full overflow-hidden px-1 text-sm leading-tight text-foreground">
              {object.text ?? t("objects.signature")}
            </span>
          ) : null}
          {object.kind === "rectangle" ? (
            <span
              className="block h-full w-full"
              style={{
                backgroundColor:
                  object.style === "highlight"
                    ? "rgba(255, 220, 0, 0.35)"
                    : "#111",
              }}
            />
          ) : null}
          {(object.kind === "image" || object.kind === "signature") &&
          object.src !== undefined ? (
            <span
              className="block h-full w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${object.src}")` }}
            />
          ) : null}
        </button>
      )}
      {selected && onResize !== undefined && !disabled && !editing ? (
        <button
          type="button"
          aria-label={t("resize")}
          className="absolute -right-1.5 -bottom-1.5 size-4 rounded-sm border border-foreground bg-background"
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              originWidth: object.width,
              originHeight: object.height,
            };
          }}
          onPointerMove={(event) => {
            const resize = resizeRef.current;

            if (resize === null) {
              return;
            }

            onResize(
              resize.originWidth + (event.clientX - resize.startX) / scale,
              resize.originHeight + (event.clientY - resize.startY) / scale,
            );
          }}
          onPointerUp={() => {
            resizeRef.current = null;
          }}
        />
      ) : null}
    </div>
  );
}
