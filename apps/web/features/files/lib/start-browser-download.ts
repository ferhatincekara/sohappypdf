export function assertBrowserDownloadUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid download URL");
  }

  return parsed.toString();
}

export function startBrowserDownload(url: string): void {
  const href = assertBrowserDownloadUrl(url);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener noreferrer";
  anchor.referrerPolicy = "no-referrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
