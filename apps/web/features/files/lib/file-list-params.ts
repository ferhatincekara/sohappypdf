import { APP_PATHS } from "@/features/app-shell";

export type FileListParams = {
  cursor?: string;
};

export function parseFileListSearchParams(
  searchParams: URLSearchParams,
): FileListParams {
  const cursor = searchParams.get("cursor")?.trim();

  if (cursor === undefined || cursor.length === 0) {
    return {};
  }

  return { cursor };
}

export function fileListHref(params: FileListParams): {
  pathname: string;
  query?: { cursor: string };
} {
  if (params.cursor === undefined || params.cursor.length === 0) {
    return { pathname: APP_PATHS.files };
  }

  return {
    pathname: APP_PATHS.files,
    query: { cursor: params.cursor },
  };
}
