import { loadAdminConfig } from "@sohappypdf/config";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function SettingsPage() {
  const actor = await requireAdmin();
  const config = loadAdminConfig();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Administrator identity and how access is granted. This is not a customer settings page."
      />
      <DetailSection title="Current administrator">
        <DetailGrid
          items={[
            { label: "User ID", value: actor.userId },
            { label: "Email", value: actor.email },
            { label: "Name", value: actor.name },
            { label: "Role", value: actor.role },
          ]}
        />
      </DetailSection>
      <DetailSection title="Authorization">
        <DetailGrid
          items={[
            {
              label: "Durable role",
              value:
                "Stored on the user row as role=admin. Server-side checks read the database on every request.",
            },
            {
              label: "Bootstrap IDs configured",
              value: String(config.bootstrapUserIds.length),
            },
            {
              label: "Admin origin",
              value: config.adminUrl ?? "Not configured",
            },
          ]}
        />
      </DetailSection>
    </>
  );
}
