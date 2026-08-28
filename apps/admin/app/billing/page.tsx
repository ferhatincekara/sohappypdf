import { AdminShell } from "@/components/admin-shell";
import { fetchAdminBilling } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";
import { CreditAdjustmentForm } from "./credit-adjustment-form";

function formatBytes(value: number): string {
  const mib = value / (1024 * 1024);
  if (mib >= 1024) {
    return `${Math.round((mib / 1024) * 10) / 10} GiB`;
  }
  return `${Math.round(mib)} MiB`;
}

export default async function AdminBillingPage() {
  const actor = await requireAdminPage();
  const billing = await fetchAdminBilling();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Polar remains the payment provider. This view is operational only.
          </p>
        </div>
        <section>
          <h2 className="text-sm font-medium">Plans</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(["free", "pro"] as const).map((plan) => {
              const limits = billing.plans[plan];
              return (
                <div
                  key={plan}
                  className="rounded-lg border border-border bg-card p-4 text-sm"
                >
                  <p className="font-medium capitalize">{plan}</p>
                  <p className="mt-2 text-muted-foreground">
                    {limits.monthlyWebCredits} web credits ·{" "}
                    {limits.monthlyAiCredits} AI credits ·{" "}
                    {limits.operationsPerDay === null
                      ? "unlimited operations"
                      : `${String(limits.operationsPerDay)} operations/day`}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Files up to {formatBytes(limits.maxFileSizeBytes)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Users by plan</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Free</p>
              <p className="mt-2 text-lg font-semibold">
                {billing.usersByPlan.free}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Pro</p>
              <p className="mt-2 text-lg font-semibold">
                {billing.usersByPlan.pro}
              </p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Current period usage</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Web used", billing.usage.webCreditsUsed],
                ["API used", billing.usage.apiCreditsUsed],
                ["AI used", billing.usage.aiCreditsUsed],
                ["Operations", billing.usage.conversionsUsed],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Manual credit adjustment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Adds credits to the selected meter. A reason is required and stored
            in the ledger.
          </p>
          <div className="mt-3">
            <CreditAdjustmentForm />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Recent ledger</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {billing.ledger.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No ledger entries in this snapshot.
              </li>
            ) : (
              billing.ledger.map((entry) => (
                <li key={entry.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{entry.type}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {entry.source} · {entry.amount}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.reason}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
