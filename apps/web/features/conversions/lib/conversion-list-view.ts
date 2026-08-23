export const CONVERSION_LIST_VIEWS = [
  "loading",
  "error",
  "empty",
  "items",
] as const;

export type ConversionListView = (typeof CONVERSION_LIST_VIEWS)[number];

export function conversionListView(input: {
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
}): ConversionListView {
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
