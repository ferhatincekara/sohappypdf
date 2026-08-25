import type { Metadata } from "next";
import { DeveloperDocsPage } from "@/features/developer-docs";

export const metadata: Metadata = {
  title: "SohappyPDF API",
  description:
    "Authenticate with an API key, upload a file, process a tool, and download the result. API credits are separate from web credits.",
};

export default function DevelopersRoute() {
  return <DeveloperDocsPage />;
}
