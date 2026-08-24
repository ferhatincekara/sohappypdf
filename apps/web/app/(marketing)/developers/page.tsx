import type { Metadata } from "next";
import { DeveloperDocsPage } from "@/features/developer-docs";

export const metadata: Metadata = {
  title: "SohappyPDF API",
  description: "Public v1 API documentation for SohappyPDF.",
};

export default function DevelopersRoute() {
  return <DeveloperDocsPage />;
}
