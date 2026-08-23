const IPV4_PATTERN =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_PATTERN = /^[0-9a-f:]+$/i;

/**
 * Prefer Vercel-owned client IP headers. `x-real-ip` is the connecting
 * client IP Vercel records. `x-vercel-forwarded-for` is Vercel's trusted
 * forwarded list. `x-forwarded-for` is last because clients can prepend
 * values. Invalid or missing values become "unknown".
 */
export function getClientIp(headers: Headers): string {
  const candidates = [
    headers.get("x-real-ip"),
    headers.get("x-vercel-forwarded-for"),
    firstForwardedIp(headers.get("x-forwarded-for")),
  ];

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== undefined &&
      isIpAddress(candidate)
    ) {
      return candidate;
    }
  }

  return "unknown";
}

function firstForwardedIp(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const [first] = value.split(",");
  return first?.trim();
}

function isIpAddress(value: string): boolean {
  const candidate = value.trim();

  if (candidate.length === 0 || candidate.length > 64) {
    return false;
  }

  if (IPV4_PATTERN.test(candidate)) {
    return true;
  }

  return candidate.includes(":") && IPV6_PATTERN.test(candidate);
}
