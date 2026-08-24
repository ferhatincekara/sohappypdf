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

/**
 * Files are no longer a primary account destination.
 * Keep this helper for leftover list UI used by temporary processing flows.
 */
export function fileListHref(params: FileListParams): {
  pathname: string;
  query?: { cursor: string };
} {
  if (params.cursor === undefined || params.cursor.length === 0) {
    return { pathname: APP_PATHS.activity };
  }

  return {
    pathname: APP_PATHS.activity,
    query: { cursor: params.cursor },
  };
}
