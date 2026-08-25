"use client";

import { useState } from "react";
import { AdminApiError, submitAdminCreditAdjustment } from "@/lib/admin-api";

export function CreditAdjustmentForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);

    const userId = String(formData.get("userId") ?? "").trim();
    const source = String(formData.get("source") ?? "");
    const amount = Number(formData.get("amount"));
    const reason = String(formData.get("reason") ?? "");

    if (source !== "web" && source !== "api" && source !== "ai") {
      setError("Choose a credit meter.");
      setPending(false);
      return;
    }

    try {
      await submitAdminCreditAdjustment({
        userId,
        source,
        amount,
        reason,
      });
      setMessage("Adjustment recorded.");
    } catch (caught) {
      setError(
        caught instanceof AdminApiError ? caught.message : "Adjustment failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex max-w-xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          User ID
          <input
            name="userId"
            required
            className="rounded-md border border-border bg-background px-3 py-2"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Meter
          <select
            name="source"
            className="rounded-md border border-border bg-background px-3 py-2"
            defaultValue="web"
          >
            <option value="web">Web credits</option>
            <option value="api">API credits</option>
            <option value="ai">AI credits</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Amount
          <input
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            className="rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Reason
          <input
            name="reason"
            required
            minLength={8}
            maxLength={500}
            className="rounded-md border border-border bg-background px-3 py-2"
            placeholder="Why this adjustment is being made"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Recording…" : "Record adjustment"}
      </button>
      {message !== null ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      {error !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
