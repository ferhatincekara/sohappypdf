export function getBearerToken(headers: Headers): string | undefined {
  const authorization = headers.get("authorization");

  if (authorization === null) {
    return undefined;
  }

  const match = /^Bearer[ \t]+(\S+)[ \t]*$/i.exec(authorization);
  return match?.[1];
}
