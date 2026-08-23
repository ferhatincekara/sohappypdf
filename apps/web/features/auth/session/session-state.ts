export function hasWebSession<T>(session: T | null): session is T {
  return session !== null;
}
