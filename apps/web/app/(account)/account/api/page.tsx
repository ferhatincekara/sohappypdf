import type { Metadata } from "next";
import { ApiKeysPageContent } from "@/features/api-keys";
import { buildAccountPageMetadata } from "@/features/app-shell/lib/account-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildAccountPageMetadata("apiKeys");
}

export default ApiKeysPageContent;
