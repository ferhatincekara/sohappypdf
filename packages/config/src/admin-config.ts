import { type EnvSource, getOptionalEnv } from "./env.js";

export type AdminConfig = {
  userIds: readonly string[];
  emails: readonly string[];
};

export const EMPTY_ADMIN_CONFIG: AdminConfig = {
  userIds: [],
  emails: [],
};

function parseCsv(value: string | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }

  const items: string[] = [];

  for (const part of value.split(",")) {
    const trimmed = part.trim();

    if (trimmed.length === 0) {
      continue;
    }

    items.push(trimmed);
  }

  return items;
}

function parseEmails(value: string | undefined): readonly string[] {
  return parseCsv(value).map((email) => email.toLowerCase());
}

export function loadAdminConfig(source: EnvSource = process.env): AdminConfig {
  return {
    userIds: parseCsv(getOptionalEnv("ADMIN_USER_IDS", source)),
    emails: parseEmails(getOptionalEnv("ADMIN_EMAILS", source)),
  };
}

export function isAdminAllowlisted(
  actor: { userId: string; email: string },
  config: AdminConfig,
): boolean {
  if (config.userIds.some((id) => id === actor.userId)) {
    return true;
  }

  const email = actor.email.trim().toLowerCase();

  if (email.length === 0) {
    return false;
  }

  return config.emails.some((allowed) => allowed === email);
}
