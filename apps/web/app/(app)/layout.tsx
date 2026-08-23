import type { ReactNode } from "react";
import { requireWebSession } from "@/features/auth/session/require-web-session";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireWebSession();

  return children;
}
