import { describe, expect, test } from "bun:test";
import { fileListView } from "@/features/files/lib/file-list-view";

describe("file list view", () => {
  test("prefers loading and error before empty", () => {
    expect(
      fileListView({ isLoading: true, isError: false, itemCount: 0 }),
    ).toBe("loading");
    expect(
      fileListView({ isLoading: false, isError: true, itemCount: 0 }),
    ).toBe("error");
    expect(
      fileListView({ isLoading: false, isError: false, itemCount: 0 }),
    ).toBe("empty");
  });

  test("keeps existing items visible while refetching", () => {
    expect(
      fileListView({ isLoading: true, isError: false, itemCount: 2 }),
    ).toBe("items");
    expect(
      fileListView({ isLoading: false, isError: true, itemCount: 2 }),
    ).toBe("items");
  });
});
