import type { NextConfig } from "next";

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

const workspacePackages = [
  "@sohappypdf/api-keys",
  "@sohappypdf/auth",
  "@sohappypdf/billing",
  "@sohappypdf/config",
  "@sohappypdf/conversions",
  "@sohappypdf/core",
  "@sohappypdf/db",
  "@sohappypdf/files",
  "@sohappypdf/logger",
  "@sohappypdf/queue",
  "@sohappypdf/rate-limit",
  "@sohappypdf/storage",
  "@sohappypdf/tools",
  "@sohappypdf/utils",
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  agentRules: false,
  transpilePackages: workspacePackages,
  serverExternalPackages: ["bullmq", "ioredis", "@valkey/valkey-glide"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@valkey/valkey-glide": false,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiRewriteOrigin}/api/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
