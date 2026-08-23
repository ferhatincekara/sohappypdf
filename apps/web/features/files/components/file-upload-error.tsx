"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function FileUploadError({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
