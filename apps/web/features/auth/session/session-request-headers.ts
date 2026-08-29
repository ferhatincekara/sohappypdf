export function cookieHeaderFromStore(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string | undefined {
  if (cookies.length === 0) {
    return undefined;
  }

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
