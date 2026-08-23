export const API_KEY_LIST_VIEWS = [
  "loading",
  "error",
  "empty",
  "items",
] as const;

export type ApiKeyListView = (typeof API_KEY_LIST_VIEWS)[number];

export function apiKeyListView(input: {
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
}): ApiKeyListView {
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
