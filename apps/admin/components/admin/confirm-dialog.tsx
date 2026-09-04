"use client";

import { Dialog } from "@base-ui/react/dialog";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  triggerLabel,
  triggerVariant = "outline",
  confirmDisabled = false,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  triggerLabel: string;
  triggerVariant?: "outline" | "destructive" | "ghost";
  confirmDisabled?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        nativeButton={false}
        render={(props) => (
          <Button {...props} variant={triggerVariant} size="sm">
            {triggerLabel}
          </Button>
        )}
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-4 shadow-lg">
          <Dialog.Title className="text-base font-semibold">
            {title}
          </Dialog.Title>
          <div className="mt-2 text-sm text-muted-foreground">
            {description}
          </div>
          {error !== null ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              disabled={pending || confirmDisabled}
              onClick={() => {
                setPending(true);
                setError(null);
                void onConfirm()
                  .then(() => {
                    setOpen(false);
                  })
                  .catch((caught: unknown) => {
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "The action could not be completed.",
                    );
                  })
                  .finally(() => {
                    setPending(false);
                  });
              }}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
