import { ConversionStatusPageContent } from "@/features/conversions";

export default async function ConversionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ConversionStatusPageContent conversionId={id} />;
}
