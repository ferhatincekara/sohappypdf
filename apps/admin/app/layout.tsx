import type { Metadata } from "next";
import { Onest } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { getPublicAdminUrl } from "@/config/public-env";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAdminUrl()),
  title: {
    default: "SoHappyPDF Admin",
    template: "%s · SoHappyPDF Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={onest.variable}>
      <body>
        {children}
        <Toaster theme="system" />
      </body>
    </html>
  );
}
