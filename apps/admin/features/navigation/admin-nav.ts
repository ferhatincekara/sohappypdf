export const ADMIN_NAV = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Overview" }],
  },
  {
    label: "People",
    items: [
      { href: "/users", label: "Users" },
      { href: "/anonymous-sessions", label: "Anonymous Sessions" },
    ],
  },
  {
    label: "Processing",
    items: [
      { href: "/executions", label: "Executions" },
      { href: "/queues", label: "Queues" },
      { href: "/workers", label: "Workers" },
    ],
  },
  {
    label: "Catalog",
    items: [{ href: "/tools", label: "Tools" }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/billing", label: "Billing" },
      { href: "/api", label: "API" },
      { href: "/usage", label: "Usage" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/storage", label: "Storage" },
      { href: "/system", label: "System" },
      { href: "/audit-logs", label: "Audit Logs" },
      { href: "/settings", label: "Settings" },
    ],
  },
] as const;

export function isActiveAdminPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
