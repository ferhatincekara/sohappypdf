import { describe, expect, test } from "bun:test";
import {
  conversionListHref,
  parseConversionListSearchParams,
} from "./conversion-list-params";

describe("conversion list params", () => {
  test("maps status query values onto history filters", () => {
    expect(parseConversionListSearchParams(new URLSearchParams())).toEqual({
      filter: "all",
    });
    expect(
      parseConversionListSearchParams(
        new URLSearchParams("status=completed&cursor=abc"),
      ),
    ).toEqual({
      filter: "completed",
      status: "completed",
      cursor: "abc",
    });
    expect(
      parseConversionListSearchParams(new URLSearchParams("status=pending")),
    ).toEqual({
      filter: "all",
      status: "pending",
    });
  });

  test("builds shareable history hrefs and drops cursor on the first page", () => {
    expect(conversionListHref({ filter: "all" })).toEqual({
      pathname: "/account/activity",
    });
    expect(conversionListHref({ filter: "failed", cursor: "next-1" })).toEqual({
      pathname: "/account/activity",
      query: { status: "failed", cursor: "next-1" },
    });
  });
});
