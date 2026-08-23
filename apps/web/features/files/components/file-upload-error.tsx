"use client";

import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FileUploadError({
  message,
  upgradeLink,
}: {
  message: string | null;
  upgradeLink?: ReactNode;
}) {
  if (message === null) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>
        <span>{message}</span>
        {upgradeLink === undefined || upgradeLink === null ? null : (
          <span className="ml-1">{upgradeLink}</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
