import { createHash } from "node:crypto";

const GRAVATAR_SIZE = 96;

export function gravatarUrl(email: string, size = GRAVATAR_SIZE): string {
  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?s=${String(size)}&d=404`;
}

export function resolveAvatarUrl(email: string, image?: string | null): string {
  const storedImage = image?.trim() ?? "";

  if (storedImage.length > 0) {
    return storedImage;
  }

  return gravatarUrl(email);
}
