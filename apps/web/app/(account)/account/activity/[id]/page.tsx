import { ConversionStatusPageContent } from "@/features/conversions";

export default async function AccountActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ConversionStatusPageContent conversionId={id} />;
}
