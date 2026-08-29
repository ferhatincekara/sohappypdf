import type { Metadata } from "next";
import { buildAccountPageMetadata } from "@/features/app-shell/lib/account-page-metadata";
import { ConversionStatusPageContent } from "@/features/conversions";

export async function generateMetadata(): Promise<Metadata> {
  return buildAccountPageMetadata("conversions.status");
}

export default async function AccountActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ConversionStatusPageContent conversionId={id} />;
}
