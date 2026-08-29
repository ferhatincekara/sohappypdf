const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
}

function parseHostname(value: string): string | undefined {
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

function normalizeCookieDomain(value: string): string {
  return value.trim().replace(/^\./, "").toLowerCase();
}

function sharedRegistrableDomain(
  leftHost: string,
  rightHost: string,
): string | undefined {
  if (
    leftHost === rightHost ||
    isLocalHost(leftHost) ||
    isLocalHost(rightHost)
  ) {
    return undefined;
  }

  const leftLabels = leftHost.split(".");
  const rightLabels = rightHost.split(".");
  const shared: string[] = [];

  for (
    let offset = 1;
    offset <= leftLabels.length && offset <= rightLabels.length;
    offset += 1
  ) {
    const leftLabel = leftLabels[leftLabels.length - offset];
    const rightLabel = rightLabels[rightLabels.length - offset];

    if (leftLabel === undefined || leftLabel !== rightLabel) {
      break;
    }

    shared.unshift(leftLabel);
  }

  if (shared.length < 2) {
    return undefined;
  }

  return shared.join(".");
}

/**
 * Session cookies are set by the API host. Account pages read them on the
 * web host. Share the parent domain when the two hosts belong together.
 */
export function resolveAuthCookieDomain(input: {
  authBaseUrl: string;
  appUrl?: string;
  cookieDomain?: string;
}): string | undefined {
  if (input.cookieDomain !== undefined) {
    const explicit = normalizeCookieDomain(input.cookieDomain);

    if (explicit === "" || isLocalHost(explicit) || !explicit.includes(".")) {
      return undefined;
    }

    return explicit;
  }

  const authHost = parseHostname(input.authBaseUrl);

  if (authHost === undefined || isLocalHost(authHost)) {
    return undefined;
  }

  if (input.appUrl !== undefined) {
    const appHost = parseHostname(input.appUrl);

    if (appHost !== undefined) {
      const shared = sharedRegistrableDomain(authHost, appHost);

      if (shared !== undefined) {
        return shared;
      }
    }
  }

  if (authHost.startsWith("api.") && authHost.split(".").length >= 3) {
    return authHost.slice("api.".length);
  }

  return undefined;
}
