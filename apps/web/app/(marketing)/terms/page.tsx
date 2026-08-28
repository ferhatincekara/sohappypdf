import type { Metadata } from "next";
import { LegalDocumentPage, legalPageMetadata } from "@/features/legal";

export function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("terms");
}

export default function TermsRoute() {
  return <LegalDocumentPage pageId="terms" />;
}
