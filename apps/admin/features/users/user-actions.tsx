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

export function AdjustCreditsForm({
  userId,
  webPlan,
}: {
  userId: string;
  webPlan: "free" | "pro";
}) {
  const [source, setSource] = useState<"web" | "api">("api");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const parsedAmount = Number(amount);
  const reasonReady = reason.trim().length >= 8;
  const amountReady = Number.isInteger(parsedAmount) && parsedAmount > 0;

  return (
    <ConfirmDialog
      title="Add credits"
      triggerLabel="Add credits"
      confirmLabel="Add credits"
      pendingLabel="Adding…"
      confirmDisabled={!reasonReady || !amountReady}
      description={
        <div className="space-y-3 text-foreground">
          <p className="text-muted-foreground">
            Adds credits to this billing period. API credits apply to developer
            keys. Web tool credits only apply to Free users.
          </p>
          <select
            className="admin-field"
            value={source}
            onChange={(event) => setSource(event.target.value as "web" | "api")}
          >
            <option value="api">API credits</option>
            <option value="web">Web tool credits</option>
          </select>
          {source === "web" && webPlan === "pro" ? (
            <p className="rounded-md border border-border bg-muted/60 px-3 py-2 text-xs">
              Pro users do not spend web tool credits. This adjustment is
              recorded but does not change their web access.
            </p>
          ) : null}
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label="Credit amount"
          />
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason, at least 8 characters"
            aria-label="Adjustment reason"
          />
          {reason.length > 0 && !reasonReady ? (
            <p className="text-xs text-destructive">
              Reason must be at least 8 characters.
            </p>
          ) : null}
        </div>
      }
      onConfirm={async () => {
        await adjustCreditsAction({
          userId,
          source,
          amount: parsedAmount,
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
