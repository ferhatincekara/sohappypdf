import type { ReactNode } from "react";
import { requireWebSession } from "@/features/auth/session/require-web-session";

export default async function AccountGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireWebSession();

  return children;
}
