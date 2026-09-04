"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { revokeAnonymousSessionAction } from "@/server/actions/anonymous-sessions";

export function RevokeAnonymousSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  return (
    <ConfirmDialog
      title="Revoke anonymous session"
      triggerLabel="Revoke session"
      triggerVariant="destructive"
      confirmLabel="Revoke session"
      pendingLabel="Revoking…"
      destructive
      description={
        <p>
          This deletes the anonymous session record. Temporary files still
          expire through the normal cleanup path. The session token is never
          displayed.
        </p>
      }
      onConfirm={async () => {
        await revokeAnonymousSessionAction({ sessionId });
      }}
    />
  );
}
