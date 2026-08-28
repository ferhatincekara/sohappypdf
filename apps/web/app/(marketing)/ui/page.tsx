import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUiKitEnabled, UiKitPage } from "@/features/ui-kit";

export const metadata: Metadata = {
  title: "UI kit",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UiKitRoute() {
  if (!isUiKitEnabled()) {
    notFound();
  }

  return <UiKitPage />;
}
