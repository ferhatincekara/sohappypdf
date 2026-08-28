import { createHash } from "node:crypto";

const GRAVATAR_SIZE = 96;

export function gravatarUrl(email: string, size = GRAVATAR_SIZE): string {
  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?s=${String(size)}&d=404`;
}
