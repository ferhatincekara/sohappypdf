"use client";

import { ErrorState } from "@/components/admin/error-state";
import { Button } from "@/components/ui/button";

export default function ConsoleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <ErrorState
        title="Unable to load this page"
        description="A server error occurred while loading this operations view."
      />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
