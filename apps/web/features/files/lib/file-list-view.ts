export const FILE_LIST_VIEWS = ["loading", "error", "empty", "items"] as const;

export type FileListView = (typeof FILE_LIST_VIEWS)[number];

export function fileListView(input: {
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
}): FileListView {
  if (input.isLoading && input.itemCount === 0) {
    return "loading";
  }

  if (input.isError && input.itemCount === 0) {
    return "error";
  }

  if (input.itemCount === 0) {
    return "empty";
  }

  return "items";
}
