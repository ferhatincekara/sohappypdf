import { describe, expect, test } from "bun:test";
import { filesQueryKeys } from "./file-query-keys";

describe("files query keys", () => {
  test("keeps list keys under a shared prefix for invalidation", () => {
    const firstPage = filesQueryKeys.list({});
    const nextPage = filesQueryKeys.list({ cursor: "next-1" });

    expect(firstPage.slice(0, 2)).toEqual(filesQueryKeys.lists());
    expect(nextPage.slice(0, 2)).toEqual(filesQueryKeys.lists());
    expect(firstPage).not.toEqual(nextPage);
  });
});
