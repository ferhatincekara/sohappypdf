import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const productionApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

if (
  process.env.VERCEL_ENV === "production" &&
  (productionApiBaseUrl === "" || productionApiBaseUrl.includes("localhost"))
) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be the public API origin for production builds.",
  );
}

function resolveApiRewriteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(
    /\/$/,
    "",
  );

  if (configured !== undefined && configured !== "") {
    return configured;
  }

  return "http://127.0.0.1:3001";
}

const apiRewriteOrigin = resolveApiRewriteOrigin();

const nextConfig: NextConfig = {
  typedRoutes: true,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiRewriteOrigin}/v1/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${apiRewriteOrigin}/api/auth/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/account/settings",
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
      {
        source: "/account",
        destination: "/account/settings",
        permanent: false,
      },
      {
        source: "/account/usage",
        destination: "/account/billing",
        permanent: false,
      },
      {
        source: "/account/plan",
        destination: "/account/billing",
        permanent: false,
      },
      {
        source: "/account/history",
        destination: "/account/activity",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
