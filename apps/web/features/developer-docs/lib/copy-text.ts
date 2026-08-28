export async function copyTextToClipboard(value: string): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    navigator.clipboard === undefined ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
