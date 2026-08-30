import type { CORSRule } from "@aws-sdk/client-s3";

export const BROWSER_UPLOAD_CORS_RULE_ID = "sohappypdf-browser-uploads";

const BROWSER_UPLOAD_METHODS = ["GET", "PUT", "HEAD"] as const;

export function mergeBrowserUploadCorsRules(
  existing: readonly CORSRule[] | undefined,
  origins: readonly string[],
): CORSRule[] {
  const allowedOrigins = [
    ...new Set(origins.filter((origin) => origin.length > 0)),
  ];
  const kept = (existing ?? []).filter(
    (rule) => rule.ID !== BROWSER_UPLOAD_CORS_RULE_ID,
  );

  if (allowedOrigins.length === 0) {
    return kept;
  }

  return [
    ...kept,
    {
      ID: BROWSER_UPLOAD_CORS_RULE_ID,
      AllowedHeaders: ["*"],
      AllowedMethods: [...BROWSER_UPLOAD_METHODS],
      AllowedOrigins: allowedOrigins,
      ExposeHeaders: ["ETag", "Content-Length"],
      MaxAgeSeconds: 3600,
    },
  ];
}
