import type { Metadata } from "next";
import { LegalDocumentPage, legalPageMetadata } from "@/features/legal";

export function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("cookies");
}

export default function CookiesRoute() {
  return <LegalDocumentPage pageId="cookies" />;
}
