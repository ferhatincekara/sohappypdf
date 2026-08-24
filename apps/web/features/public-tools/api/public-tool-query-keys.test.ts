import { describe, expect, test } from "bun:test";
import { publicToolQueryKeys } from "./public-tool-query-keys";

describe("public tool query keys", () => {
  test("scopes execution polling keys under a shared prefix", () => {
    const anonymous = publicToolQueryKeys.execution("exec-1", false);
    const authenticated = publicToolQueryKeys.execution("exec-1", true);

    expect(anonymous.slice(0, 2)).toEqual(publicToolQueryKeys.executions());
    expect(authenticated.slice(0, 2)).toEqual(publicToolQueryKeys.executions());
    expect(anonymous).not.toEqual(authenticated);
  });
});
