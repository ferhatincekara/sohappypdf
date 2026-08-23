import { describe, expect, test } from "bun:test";
import { apiKeyListView } from "./api-key-list-view";

describe("api key list view", () => {
  test("renders empty, loading, and error states", () => {
    expect(
      apiKeyListView({ isLoading: true, isError: false, itemCount: 0 }),
    ).toBe("loading");
    expect(
      apiKeyListView({ isLoading: false, isError: true, itemCount: 0 }),
    ).toBe("error");
    expect(
      apiKeyListView({ isLoading: false, isError: false, itemCount: 0 }),
    ).toBe("empty");
  });

  test("keeps existing keys visible while refetching", () => {
    expect(
      apiKeyListView({ isLoading: true, isError: false, itemCount: 2 }),
    ).toBe("items");
  });
});
