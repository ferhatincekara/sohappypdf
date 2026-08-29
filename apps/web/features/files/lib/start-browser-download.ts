import { buildZipArchive } from "@sohappypdf/utils/zip";

export type BrowserDownloadItem = {
  url: string;
  filename: string;
};

export function assertBrowserDownloadUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid download URL");
  }

  return parsed.toString();
}

export function startBrowserDownload(url: string, filename?: string): void {
  const href = assertBrowserDownloadUrl(url);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener noreferrer";
  anchor.referrerPolicy = "no-referrer";

  if (filename !== undefined && filename.length > 0) {
    anchor.download = filename;
  }

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

const BULK_DOWNLOAD_GAP_MS = 400;
const DEFAULT_ARCHIVE_NAME = "sohappypdf-export.zip";

async function downloadItemsSequentially(
  items: readonly BrowserDownloadItem[],
): Promise<void> {
  for (const [index, item] of items.entries()) {
    startBrowserDownload(item.url, item.filename);

    if (index < items.length - 1) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, BULK_DOWNLOAD_GAP_MS);
      });
    }
  }
}

export async function startBrowserDownloads(
  items: readonly BrowserDownloadItem[],
  archiveName = DEFAULT_ARCHIVE_NAME,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  if (items.length === 1) {
    const item = items[0];

    if (item !== undefined) {
      startBrowserDownload(item.url, item.filename);
    }

    return;
  }

  try {
    const files = await Promise.all(
      items.map(async (item) => {
        const response = await fetch(assertBrowserDownloadUrl(item.url));

        if (!response.ok) {
          throw new Error("download failed");
        }

        return {
          name: item.filename,
          data: new Uint8Array(await response.arrayBuffer()),
        };
      }),
    );

    const blob = new Blob([buildZipArchive(files)], {
      type: "application/zip",
    });
    const objectUrl = URL.createObjectURL(blob);
    startBrowserDownload(objectUrl, archiveName);
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1_000);
  } catch {
    await downloadItemsSequentially(items);
  }
}
