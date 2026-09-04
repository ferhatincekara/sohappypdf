import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminSystemHealth } from "@/server/query/system";

export default async function SystemPage() {
  const health = await getAdminSystemHealth();

  return (
    <>
      <PageHeader
        title="System"
        description="Safe connectivity checks. Credentials and connection strings are never shown."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {health.services.map((service) => (
          <section
            key={service.name}
            className="rounded-md border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{service.name}</h2>
              <StatusBadge value={service.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {service.detail}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {service.latencyMs === null
                ? "Latency unavailable"
                : `${service.latencyMs} ms`}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
