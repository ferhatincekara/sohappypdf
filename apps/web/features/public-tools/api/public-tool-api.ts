import type { AxiosInstance } from "axios";
import {
  ConversionApiRequestError,
  conversionApi,
} from "@/features/conversions/api/conversion-api";
import type {
  ConversionType,
  PublicConversion,
} from "@/features/conversions/types/conversion";
import {
  completeUpload as completeAuthenticatedUpload,
  createDownloadUrl as createAuthenticatedDownloadUrl,
  createUpload as createAuthenticatedUpload,
  FileApiRequestError,
} from "@/features/files/api/file-api";
import type {
  CreateUploadInput,
  CreateUploadResponse,
  FileDownloadResponse,
  PublicFile,
} from "@/features/files/types/file";
import { apiClient } from "@/lib/api/client";

export async function createAnonymousUpload(
  input: CreateUploadInput,
  options?: { signal?: AbortSignal },
): Promise<CreateUploadResponse> {
  try {
    const response = await apiClient.post<CreateUploadResponse>(
      "/api/v1/anonymous/files/upload",
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

export async function completeAnonymousUpload(
  fileId: string,
  options?: { signal?: AbortSignal },
): Promise<PublicFile> {
  try {
    const response = await apiClient.post<{ file: PublicFile }>(
      `/api/v1/anonymous/files/${fileId}/complete`,
      undefined,
      { signal: options?.signal },
    );

    return response.data.file;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export async function createAnonymousConversion(input: {
  sourceFileId: string;
  type: ConversionType;
  additionalFileIds?: string[];
  options?: Record<string, unknown>;
}): Promise<PublicConversion> {
  try {
    const response = await apiClient.post<{ conversion: PublicConversion }>(
      "/api/v1/anonymous/conversions",
      {
        sourceFileId: input.sourceFileId,
        type: input.type,
        ...(input.additionalFileIds === undefined
          ? {}
          : { additionalFileIds: input.additionalFileIds }),
        ...(input.options === undefined ? {} : { options: input.options }),
      },
    );

    return response.data.conversion;
  } catch (error) {
    throw new ConversionApiRequestError(error);
  }
}

export async function getAnonymousConversion(
  id: string,
): Promise<PublicConversion> {
  try {
    const response = await apiClient.get<{ conversion: PublicConversion }>(
      `/api/v1/anonymous/conversions/${id}`,
    );

    return response.data.conversion;
  } catch (error) {
    throw new ConversionApiRequestError(error);
  }
}

export async function createAnonymousDownloadUrl(
  fileId: string,
): Promise<FileDownloadResponse> {
  try {
    const response = await apiClient.post<FileDownloadResponse>(
      `/api/v1/anonymous/files/${fileId}/download`,
    );

    return response.data;
  } catch (error) {
    throw new FileApiRequestError(error);
  }
}

export type PublicToolConversionInput = {
  sourceFileId: string;
  type: ConversionType;
  targetFormat: string;
  additionalFileIds?: string[];
  options?: Record<string, unknown>;
};

export function createPublicToolApis(authenticated: boolean) {
  return {
    createUpload: authenticated
      ? createAuthenticatedUpload
      : createAnonymousUpload,
    completeUpload: authenticated
      ? completeAuthenticatedUpload
      : completeAnonymousUpload,
    createConversion: (input: PublicToolConversionInput) =>
      authenticated
        ? conversionApi.create({
            sourceFileId: input.sourceFileId,
            type: input.type,
            targetFormat: input.targetFormat,
            additionalFileIds: input.additionalFileIds,
            options: input.options,
          })
        : createAnonymousConversion(input),
    getConversion: authenticated
      ? (id: string) => conversionApi.get(id)
      : getAnonymousConversion,
    createDownloadUrl: authenticated
      ? createAuthenticatedDownloadUrl
      : createAnonymousDownloadUrl,
  };
}
