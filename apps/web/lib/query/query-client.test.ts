import { describe, expect, test } from "bun:test";
import { createAppQueryClient } from "@/lib/query/query-client";

describe("query client", () => {
  test("uses conservative defaults without fetching data", () => {
    const client = createAppQueryClient();

    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
    expect(client.getDefaultOptions().queries?.retry).toBe(1);
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(
      false,
    );
  });
});
