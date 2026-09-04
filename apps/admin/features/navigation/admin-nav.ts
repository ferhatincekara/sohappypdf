export const ADMIN_NAV = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Overview", icon: "overview" }],
  },
  {
    label: "People",
    items: [
      { href: "/users", label: "Users", icon: "users" },
      {
        href: "/anonymous-sessions",
        label: "Anonymous Sessions",
        icon: "anonymous",
      },
    ],
  },
  {
    label: "Processing",
    items: [
      { href: "/executions", label: "Executions", icon: "executions" },
      { href: "/queues", label: "Queues", icon: "queues" },
      { href: "/workers", label: "Workers", icon: "workers" },
    ],
  },
  {
    label: "Catalog",
    items: [{ href: "/tools", label: "Tools", icon: "tools" }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/billing", label: "Billing", icon: "billing" },
      { href: "/api", label: "API", icon: "api" },
      { href: "/usage", label: "Usage", icon: "usage" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/storage", label: "Storage", icon: "storage" },
      { href: "/system", label: "System", icon: "system" },
      { href: "/audit-logs", label: "Audit Logs", icon: "audit" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
  },
] as const;

export type AdminNavIcon = (typeof ADMIN_NAV)[number]["items"][number]["icon"];

export function isActiveAdminPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
