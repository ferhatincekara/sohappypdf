import { apiClient } from "@/lib/api/client";
import type {
  CreateUploadInput,
  CreateUploadResponse,
  FileDownloadResponse,
  FileListResponse,
  PublicFile,
} from "../types/file";
import { toFileClientError } from "./file-errors";

export class FileApiRequestError extends Error {
  readonly clientError: ReturnType<typeof toFileClientError>;

  constructor(error: unknown) {
    super("File request failed");
    this.name = "FileApiRequestError";
    this.clientError = toFileClientError(error);
  }
}

export async function createUpload(
  input: CreateUploadInput,
  options?: { signal?: AbortSignal },
): Promise<CreateUploadResponse> {
  try {
    const response = await apiClient.post<CreateUploadResponse>(
      "/api/v1/files/upload",
      {
        filename: input.filename,
        contentType: input.contentType,
        size: input.size,
      },
      { signal: options?.signal },
    );

    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export async function completeUpload(
  fileId: string,
  options?: { signal?: AbortSignal },
): Promise<PublicFile> {
  try {
    const response = await apiClient.post<{ file: PublicFile }>(
      `/api/v1/files/${fileId}/complete`,
      undefined,
      { signal: options?.signal },
    );

    return response.data.file;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export async function listFiles(): Promise<FileListResponse> {
  try {
    const response = await apiClient.get<FileListResponse>("/api/v1/files");
    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export async function createDownloadUrl(
  fileId: string,
  options?: { signal?: AbortSignal },
): Promise<FileDownloadResponse> {
  try {
    const response = await apiClient.post<FileDownloadResponse>(
      `/api/v1/files/${fileId}/download`,
      undefined,
      { signal: options?.signal },
    );

    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}
