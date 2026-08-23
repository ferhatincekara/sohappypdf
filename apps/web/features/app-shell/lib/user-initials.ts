export function getUserInitials(name: string, email: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0 && !part.includes("@"));

  if (parts.length >= 2) {
    const first = parts[0]?.[0];
    const second = parts[1]?.[0];

    if (first !== undefined && second !== undefined) {
      return `${first}${second}`.toUpperCase();
    }
  }

  if (parts[0] !== undefined && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const localPart = email.split("@")[0]?.trim() ?? "";

  if (localPart.length >= 2) {
    return localPart.slice(0, 2).toUpperCase();
  }

  if (localPart.length === 1) {
    return localPart.toUpperCase();
  }

  return "U";
}
