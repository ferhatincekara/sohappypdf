export function isLocalDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const { hostname } = url;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    if (hostname.startsWith("192.168.") || hostname.startsWith("10.")) {
      return url.protocol === "http:";
    }

    const privateClassB = /^172\.(\d+)\./.exec(hostname);

    if (privateClassB !== null) {
      const secondOctet = Number(privateClassB[1]);

      if (secondOctet >= 16 && secondOctet <= 31) {
        return url.protocol === "http:";
      }
    }

    return false;
  } catch {
    return false;
  }
}
