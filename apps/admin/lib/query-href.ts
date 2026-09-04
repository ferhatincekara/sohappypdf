export function withQuery(
  pathname: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query.length === 0 ? pathname : `${pathname}?${query}`;
}
