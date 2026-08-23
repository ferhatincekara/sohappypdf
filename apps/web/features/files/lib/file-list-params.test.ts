import { describe, expect, test } from "bun:test";
import { fileListHref, parseFileListSearchParams } from "./file-list-params";

describe("file list params", () => {
  test("reads a cursor from the query string", () => {
    expect(
      parseFileListSearchParams(new URLSearchParams("cursor=abc")),
    ).toEqual({ cursor: "abc" });
    expect(parseFileListSearchParams(new URLSearchParams())).toEqual({});
  });

  test("builds a shareable files href", () => {
    expect(fileListHref({})).toEqual({ pathname: "/app/files" });
    expect(fileListHref({ cursor: "next-1" })).toEqual({
      pathname: "/app/files",
      query: { cursor: "next-1" },
    });
  });
});
