import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  agentRules: false,
  serverExternalPackages: ["pdfjs-dist"],
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/app/files",
        destination: "/account/activity",
        permanent: true,
      },
      {
        source: "/app/conversions",
        destination: "/account/activity",
        permanent: true,
      },
      {
        source: "/app/conversions/:id",
        destination: "/account/activity/:id",
        permanent: true,
      },
      {
        source: "/app/api-keys",
        destination: "/account/api",
        permanent: true,
      },
      {
        source: "/app/settings",
        destination: "/account/settings",
        permanent: true,
      },
      {
        source: "/app/settings/billing",
        destination: "/account/billing",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
