import type { AxiosInstance } from "axios";
import { apiClient } from "@/lib/api/client";
import type {
  CreateUploadInput,
  CreateUploadResponse,
  FileDownloadResponse,
  FileListQuery,
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
      "/v1/files/upload",
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
      `/v1/files/${fileId}/complete`,
      undefined,
      { signal: options?.signal },
    );

    return response.data.file;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export type FileListApi = {
  list: (
    query?: FileListQuery,
    options?: { signal?: AbortSignal },
  ) => Promise<FileListResponse>;
  delete: (
    fileId: string,
    options?: { signal?: AbortSignal },
  ) => Promise<PublicFile>;
};

export function createFileListApi(
  client: AxiosInstance = apiClient,
): FileListApi {
  return {
    async list(query = {}, options) {
      try {
        const response = await client.get<FileListResponse>("/v1/files", {
          params: {
            ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
            ...(query.limit === undefined ? {} : { limit: query.limit }),
          },
          signal: options?.signal,
        });
        return response.data;
      } catch (error) {
        throw new FileApiRequestError(error);
      }
    },

    async delete(fileId, options) {
      try {
        const response = await client.delete<{ file: PublicFile }>(
          `/v1/files/${fileId}`,
          { signal: options?.signal },
        );

        return response.data.file;
      } catch (error) {
        throw new FileApiRequestError(error);
      }
    },
  };
}

export const fileListApi = createFileListApi();

export async function listFiles(
  query: FileListQuery = {},
  options?: { signal?: AbortSignal },
): Promise<FileListResponse> {
  return fileListApi.list(query, options);
}

export async function deleteFile(
  fileId: string,
  options?: { signal?: AbortSignal },
): Promise<PublicFile> {
  return fileListApi.delete(fileId, options);
}

export async function createDownloadUrl(
  fileId: string,
  options?: { signal?: AbortSignal },
): Promise<FileDownloadResponse> {
  try {
    const response = await apiClient.post<FileDownloadResponse>(
      `/v1/files/${fileId}/download`,
      undefined,
      { signal: options?.signal },
    );

    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export type CreateArchiveDownloadInput = {
  files: readonly { id: string; name?: string }[];
  archiveName?: string;
};

export async function createArchiveDownloadUrl(
  input: CreateArchiveDownloadInput,
  options?: { signal?: AbortSignal },
): Promise<FileDownloadResponse> {
  try {
    const response = await apiClient.post<FileDownloadResponse>(
      "/v1/files/archive",
      {
        files: input.files,
        ...(input.archiveName === undefined
          ? {}
          : { archiveName: input.archiveName }),
      },
      { signal: options?.signal },
    );

    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}
