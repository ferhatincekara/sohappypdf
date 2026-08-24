import { describe, expect, test } from "bun:test";
import { fileListHref, parseFileListSearchParams } from "./file-list-params";

describe("file list params", () => {
  test("parses optional cursor values", () => {
    expect(parseFileListSearchParams(new URLSearchParams())).toEqual({});
    expect(
      parseFileListSearchParams(new URLSearchParams("cursor=abc")),
    ).toEqual({ cursor: "abc" });
  });

  test("builds hrefs against the activity surface after the files library deprecation", () => {
    expect(fileListHref({})).toEqual({ pathname: "/account/activity" });
    expect(fileListHref({ cursor: "next-1" })).toEqual({
      pathname: "/account/activity",
      query: { cursor: "next-1" },
    });
  });
});
