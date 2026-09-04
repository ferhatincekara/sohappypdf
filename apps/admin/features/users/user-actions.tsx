"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Input } from "@/components/ui/input";
import { revokeApiKeyAction } from "@/server/actions/api-keys";
import {
  adjustCreditsAction,
  restoreUserAction,
  suspendUserAction,
} from "@/server/actions/users";

export function SuspendUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      title="Suspend this user"
      triggerLabel="Suspend user"
      triggerVariant="destructive"
      confirmLabel="Suspend user"
      pendingLabel="Suspending…"
      destructive
      description={
        <div className="space-y-2">
          <p>
            {email} will be blocked from authenticated API and web access until
            restored. Existing files still expire on the normal temporary
            schedule.
          </p>
          <label className="block text-sm font-medium" htmlFor="suspend-reason">
            Reason
          </label>
          <Input
            id="suspend-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
      }
      onConfirm={async () => {
        await suspendUserAction({ userId, reason });
      }}
    />
  );
}

export function RestoreUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  return (
    <ConfirmDialog
      title="Restore this user"
      triggerLabel="Restore user"
      confirmLabel="Restore access"
      pendingLabel="Restoring…"
      description={
        <p>
          Restore signed-in access for {email}. This does not change
          subscriptions or credit balances.
        </p>
      }
      onConfirm={async () => {
        await restoreUserAction({ userId });
      }}
    />
  );
}

export function AdjustCreditsForm({ userId }: { userId: string }) {
  const [source, setSource] = useState<"web" | "api" | "ai">("web");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      title="Add credits"
      triggerLabel="Add credits"
      confirmLabel="Add credits"
      pendingLabel="Adding…"
      description={
        <div className="space-y-2">
          <p>
            This creates a ledger adjustment. It does not edit the current
            balance in place.
          </p>
          <select
            className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm"
            value={source}
            onChange={(event) =>
              setSource(event.target.value as "web" | "api" | "ai")
            }
          >
            <option value="web">Web credits</option>
            <option value="api">API credits</option>
            <option value="ai">AI credits</option>
          </select>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (required)"
          />
          <p>
            Add {amount || "0"} {source} credits. Reason:{" "}
            {reason || "(missing)"}
          </p>
        </div>
      }
      onConfirm={async () => {
        await adjustCreditsAction({
          userId,
          source,
          amount: Number(amount),
          reason,
        });
      }}
    />
  );
}

export function RevokeApiKeyButton({
  apiKeyId,
  keyPrefix,
}: {
  apiKeyId: string;
  keyPrefix: string;
}) {
  return (
    <ConfirmDialog
      title="Revoke API key"
      triggerLabel="Revoke"
      triggerVariant="destructive"
      confirmLabel="Revoke key"
      pendingLabel="Revoking…"
      destructive
      description={
        <p>
          Requests signed with {keyPrefix}•••• will stop immediately. The secret
          is never shown here.
        </p>
      }
      onConfirm={async () => {
        await revokeApiKeyAction({ apiKeyId });
      }}
    />
  );
}

export function UserActionBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
