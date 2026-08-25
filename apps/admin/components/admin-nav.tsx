import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/anonymous", label: "Anonymous" },
  { href: "/operations", label: "Operations" },
  { href: "/billing", label: "Billing" },
  { href: "/tools", label: "Tools" },
] as const;

export function AdminNav() {
  return (
    <nav
      aria-label="Admin"
      className="flex gap-1 overflow-x-auto p-0 md:flex-col md:p-3"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
