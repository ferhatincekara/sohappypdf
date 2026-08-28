"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SignatureMethod = "draw" | "type" | "upload";

export type SignatureAsset = {
  method: SignatureMethod;
  file: File;
  previewUrl: string;
  text?: string;
};

const PAD_WIDTH = 480;
const PAD_HEIGHT = 160;

async function canvasToPngFile(
  canvas: HTMLCanvasElement,
  name: string,
): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value === null) {
        reject(new Error("empty"));
        return;
      }

      resolve(value);
    }, "image/png");
  });

  return new File([blob], name, { type: "image/png" });
}

function typedSignatureCanvas(text: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PAD_WIDTH;
  canvas.height = PAD_HEIGHT;
  const context = canvas.getContext("2d");

  if (context === null) {
    return canvas;
  }

  context.clearRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
  context.fillStyle = "#111827";
  context.font = "italic 48px Georgia, serif";
  context.textBaseline = "middle";
  context.fillText(text, 24, PAD_HEIGHT / 2, PAD_WIDTH - 48);
  return canvas;
}

export function SignaturePad({
  disabled,
  onAsset,
}: {
  disabled: boolean;
  onAsset: (asset: SignatureAsset) => void;
}) {
  const t = useTranslations("publicTools.workspaces.sign");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [method, setMethod] = useState<SignatureMethod>("draw");
  const [typed, setTyped] = useState("");
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (method !== "draw") {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (context === undefined || context === null) {
      return;
    }

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#111827";
  }, [method]);

  return (
    <section className="flex flex-col gap-4" aria-label={t("title")}>
      <div className="flex flex-wrap gap-2">
        {(["draw", "type", "upload"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={method === value ? "secondary" : "outline"}
            disabled={disabled}
            aria-pressed={method === value}
            onClick={() => {
              setMethod(value);
            }}
          >
            {t(`methods.${value}`)}
          </Button>
        ))}
      </div>

      {method === "draw" ? (
        <div className="flex flex-col gap-3">
          <canvas
            ref={canvasRef}
            width={PAD_WIDTH}
            height={PAD_HEIGHT}
            aria-label={t("methods.draw")}
            className={cn(
              "h-40 w-full max-w-lg touch-none rounded-md border border-border bg-white",
            )}
            onPointerDown={(event) => {
              const canvas = canvasRef.current;
              const context = canvas?.getContext("2d");

              if (
                canvas === null ||
                context === undefined ||
                context === null
              ) {
                return;
              }

              drawingRef.current = true;
              canvas.setPointerCapture(event.pointerId);
              const bounds = canvas.getBoundingClientRect();
              context.beginPath();
              context.moveTo(
                ((event.clientX - bounds.left) / bounds.width) * canvas.width,
                ((event.clientY - bounds.top) / bounds.height) * canvas.height,
              );
            }}
            onPointerMove={(event) => {
              if (!drawingRef.current) {
                return;
              }

              const canvas = canvasRef.current;
              const context = canvas?.getContext("2d");

              if (
                canvas === null ||
                context === undefined ||
                context === null
              ) {
                return;
              }

              const bounds = canvas.getBoundingClientRect();
              context.lineTo(
                ((event.clientX - bounds.left) / bounds.width) * canvas.width,
                ((event.clientY - bounds.top) / bounds.height) * canvas.height,
              );
              context.stroke();
              setHasInk(true);
            }}
            onPointerUp={() => {
              drawingRef.current = false;
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !hasInk}
              onClick={() => {
                const canvas = canvasRef.current;
                canvas
                  ?.getContext("2d")
                  ?.clearRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
                setHasInk(false);
              }}
            >
              {t("clear")}
            </Button>
            <Button
              type="button"
              disabled={disabled || !hasInk}
              onClick={() => {
                const canvas = canvasRef.current;

                if (canvas === null) {
                  return;
                }

                void canvasToPngFile(canvas, "signature.png").then((file) => {
                  onAsset({
                    method: "draw",
                    file,
                    previewUrl: URL.createObjectURL(file),
                  });
                });
              }}
            >
              {t("useSignature")}
            </Button>
          </div>
        </div>
      ) : null}

      {method === "type" ? (
        <div className="flex max-w-lg flex-col gap-3">
          <Label htmlFor="typed-signature">{t("typedLabel")}</Label>
          <Input
            id="typed-signature"
            value={typed}
            disabled={disabled}
            placeholder={t("typedPlaceholder")}
            autoComplete="off"
            onChange={(event) => {
              setTyped(event.target.value);
            }}
          />
          <p
            className="rounded-md border border-border bg-white px-4 py-6 text-3xl text-foreground italic"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {typed.trim().length === 0 ? t("typedPlaceholder") : typed}
          </p>
          <Button
            type="button"
            disabled={disabled || typed.trim().length === 0}
            onClick={() => {
              const canvas = typedSignatureCanvas(typed.trim());
              void canvasToPngFile(canvas, "signature.png").then((file) => {
                onAsset({
                  method: "type",
                  file,
                  previewUrl: URL.createObjectURL(file),
                  text: typed.trim(),
                });
              });
            }}
          >
            {t("useSignature")}
          </Button>
        </div>
      ) : null}

      {method === "upload" ? (
        <div className="flex max-w-lg flex-col gap-3">
          <Label htmlFor="signature-upload">{t("uploadLabel")}</Label>
          <Input
            id="signature-upload"
            type="file"
            accept="image/png,image/jpeg"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file === undefined) {
                return;
              }

              onAsset({
                method: "upload",
                file,
                previewUrl: URL.createObjectURL(file),
              });
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
