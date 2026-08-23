import { describe, expect, test } from "bun:test";
import { apiKeysQueryKeys } from "./api-key-query-keys";

describe("api key query keys", () => {
  test("keeps list keys under a shared prefix for invalidation", () => {
    expect(apiKeysQueryKeys.list().slice(0, 2)).toEqual(
      apiKeysQueryKeys.lists(),
    );
    expect(JSON.stringify(apiKeysQueryKeys.list())).not.toContain("secret");
  });
});
