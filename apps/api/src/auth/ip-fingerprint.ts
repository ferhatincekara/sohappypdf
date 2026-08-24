import { createHash } from "node:crypto";

export function fingerprintClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
