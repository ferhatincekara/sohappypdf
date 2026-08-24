"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { EditorObject } from "../types/editor-object";

export function EditorObjectView({
  object,
  selected,
  scale,
  disabled,
  onSelect,
  onMove,
}: {
  object: EditorObject;
  selected: boolean;
  scale: number;
  disabled: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const t = useTranslations("publicTools.editor");
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={t(`objects.${object.kind}`)}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        onSelect();
        dragRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          originX: object.x,
          originY: object.y,
        };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;

        if (drag === null) {
          return;
        }

        onMove(
          drag.originX + (event.clientX - drag.startX) / scale,
          drag.originY + (event.clientY - drag.startY) / scale,
        );
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      className={cn(
        "absolute overflow-hidden text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "ring-2 ring-foreground" : "ring-1 ring-transparent",
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
      {object.kind === "text" ||
      (object.kind === "signature" && object.src === undefined) ? (
        <span className="block h-full w-full truncate px-1 text-sm text-foreground">
          {object.kind === "text"
            ? object.text
            : (object.text ?? t("objects.signature"))}
        </span>
      ) : null}
      {object.kind === "rectangle" ? (
        <span
          className="block h-full w-full"
          style={{
            backgroundColor:
              object.style === "highlight" ? "rgba(255, 220, 0, 0.35)" : "#111",
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
  );
}
