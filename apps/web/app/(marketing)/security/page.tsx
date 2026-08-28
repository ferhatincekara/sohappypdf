import type { Metadata } from "next";
import { LegalDocumentPage, legalPageMetadata } from "@/features/legal";

export function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("security");
}

export default function SecurityPolicyRoute() {
  return <LegalDocumentPage pageId="security" />;
}
