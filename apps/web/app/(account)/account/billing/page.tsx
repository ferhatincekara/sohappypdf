import type { Metadata } from "next";
import { buildAccountPageMetadata } from "@/features/app-shell/lib/account-page-metadata";
import { BillingPageContent } from "@/features/billing";

export async function generateMetadata(): Promise<Metadata> {
  return buildAccountPageMetadata("billing");
}

export default BillingPageContent;
