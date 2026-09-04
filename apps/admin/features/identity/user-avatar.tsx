"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  src,
  label,
  className,
}: {
  src: string | null;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = label.trim().slice(0, 1).toUpperCase() || "?";

  if (src === null || src.length === 0 || failed) {
    return (
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        {initial}
      </span>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: remote Gravatar / profile photos
    <img
      src={src}
      alt=""
      className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
