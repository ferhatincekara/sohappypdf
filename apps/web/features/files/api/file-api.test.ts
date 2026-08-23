import { describe, expect, test } from "bun:test";
import axios, { type AxiosInstance } from "axios";
import type { PublicFile } from "../types/file";
import { createFileListApi, FileApiRequestError } from "./file-api";

function createFile(overrides: Partial<PublicFile> = {}): PublicFile {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "report.pdf",
    contentType: "application/pdf",
    size: 128,
    status: "uploaded",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T02:00:00.000Z",
    ...overrides,
  };
}

function createClient(overrides: {
  get?: AxiosInstance["get"];
  delete?: AxiosInstance["delete"];
}): AxiosInstance {
  return {
    get: overrides.get,
    delete: overrides.delete,
  } as AxiosInstance;
}

describe("file list api", () => {
  test("lists files with cursor pagination", async () => {
    const received: unknown[] = [];
    const api = createFileListApi(
      createClient({
        get: (async (url, config) => {
          received.push({ url, params: config?.params });
          return {
            data: {
              files: [createFile()],
              nextCursor: "next-1",
            },
          };
        }) as AxiosInstance["get"],
      }),
    );

    const result = await api.list({ cursor: "page-2", limit: 20 });

    expect(result.files).toHaveLength(1);
    expect(result.nextCursor).toBe("next-1");
    expect(received).toEqual([
      {
        url: "/api/v1/files",
        params: { cursor: "page-2", limit: 20 },
      },
    ]);
  });

  test("deletes a file through the API", async () => {
    const received: unknown[] = [];
    const api = createFileListApi(
      createClient({
        delete: (async (url) => {
          received.push(url);
          return { data: { file: createFile({ status: "deleted" }) } };
        }) as AxiosInstance["delete"],
      }),
    );

    const file = await api.delete("11111111-1111-4111-8111-111111111111");

    expect(file.status).toBe("deleted");
    expect(received).toEqual([
      "/api/v1/files/11111111-1111-4111-8111-111111111111",
    ]);
  });

  test("maps delete failures without exposing internals", async () => {
    const api = createFileListApi(
      createClient({
        delete: (async () => {
          throw new axios.AxiosError(
            "Request failed",
            "ERR_BAD_REQUEST",
            undefined,
            undefined,
            {
              status: 404,
              data: {
                error: {
                  code: "NOT_FOUND",
                  message: "relation files does not exist",
                },
              },
            } as never,
          );
        }) as AxiosInstance["delete"],
      }),
    );

    try {
      await api.delete("11111111-1111-4111-8111-111111111111");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(FileApiRequestError);
      if (error instanceof FileApiRequestError) {
        expect(error.clientError.code).toBe("NOT_FOUND");
        expect(error.message).toBe("File request failed");
      }
    }
  });
});
