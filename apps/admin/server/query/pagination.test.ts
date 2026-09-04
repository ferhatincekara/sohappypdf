import { describe, expect, test } from "bun:test";
import { paginated, parsePage, parsePageSize } from "./pagination.js";

describe("admin pagination", () => {
  test("rejects unbounded page sizes", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePageSize("999")).toBe(50);
    expect(paginated(["a"], 51, 1, 25).pageCount).toBe(3);
  });
});
