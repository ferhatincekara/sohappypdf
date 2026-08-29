import type { Metadata } from "next";
import { buildAccountPageMetadata } from "@/features/app-shell/lib/account-page-metadata";
import { ConversionHistoryPageContent } from "@/features/conversions";

export async function generateMetadata(): Promise<Metadata> {
  return buildAccountPageMetadata("conversions.history");
}

export default ConversionHistoryPageContent;
