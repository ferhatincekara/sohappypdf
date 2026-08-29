import axios from "axios";
import {
  isCancelError,
  StorageUploadError,
} from "@/features/files/api/file-errors";
import type { UploadProgress } from "@/features/files/types/upload-state";

export { StorageUploadError };

export async function putPresignedObject(options: {
  url: string;
  body: Blob;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}): Promise<void> {
  try {
    await axios.put(options.url, options.body, {
      headers: {
        "Content-Type": options.contentType,
      },
      signal: options.signal,
      onUploadProgress(event) {
        const total = event.total ?? options.body.size;
        const loaded = event.loaded;
        const percent =
          total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

        options.onProgress?.({ loaded, total, percent });
      },
    });
  } catch (error) {
    if (isCancelError(error)) {
      throw new StorageUploadError("cancelled");
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === undefined || error.code === "ERR_NETWORK") {
        throw new StorageUploadError("network");
      }

      if (status === 400 || status === 403) {
        throw new StorageUploadError("expired", status);
      }

      throw new StorageUploadError("failed", status);
    }

    throw new StorageUploadError("failed");
  }
}
