function isExpandableHttpsHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return false;
  }

  if (hostname.startsWith("api.")) {
    return false;
  }

  return hostname.includes(".");
}

export function httpsApexWwwOrigins(origin: string): string[] {
  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    return [];
  }

  if (parsed.protocol !== "https:" || !isExpandableHttpsHost(parsed.hostname)) {
    return [parsed.origin];
  }

  const apex = parsed.hostname.replace(/^www\./, "");

  return [`https://${apex}`, `https://www.${apex}`];
}

export function expandHttpsSiteOrigins(origins: readonly string[]): string[] {
  return [...new Set(origins.flatMap((origin) => httpsApexWwwOrigins(origin)))];
}

export function isAllowedHttpsSiteOrigin(
  origin: string,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  return httpsApexWwwOrigins(origin).some((candidate) =>
    allowedOrigins.has(candidate),
  );
}
