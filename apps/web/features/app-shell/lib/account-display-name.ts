export function resolveAccountDisplayName(name: string, email: string): string {
  const trimmed = name.trim();

  if (trimmed.length > 0 && !trimmed.includes("@")) {
    return trimmed;
  }

  const at = email.indexOf("@");
  if (at > 0) {
    return email.slice(0, at);
  }

  return email;
}

export function resolveAccountInitial(displayName: string): string {
  const char = displayName.charAt(0);
  return char ? char.toUpperCase() : "?";
}
