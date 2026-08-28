import type { Metadata } from "next";
import { LegalDocumentPage, legalPageMetadata } from "@/features/legal";

export function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("privacy");
}

export default function PrivacyPolicyRoute() {
  return <LegalDocumentPage pageId="privacy" />;
}
