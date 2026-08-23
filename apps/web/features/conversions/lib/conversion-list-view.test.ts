import { describe, expect, test } from "bun:test";
import { conversionListView } from "./conversion-list-view";

describe("conversion list view", () => {
  test("renders empty, loading, and error states", () => {
    expect(
      conversionListView({ isLoading: true, isError: false, itemCount: 0 }),
    ).toBe("loading");
    expect(
      conversionListView({ isLoading: false, isError: true, itemCount: 0 }),
    ).toBe("error");
    expect(
      conversionListView({ isLoading: false, isError: false, itemCount: 0 }),
    ).toBe("empty");
  });

  test("keeps historical rows while a page refetches", () => {
    expect(
      conversionListView({ isLoading: true, isError: false, itemCount: 3 }),
    ).toBe("items");
  });
});
