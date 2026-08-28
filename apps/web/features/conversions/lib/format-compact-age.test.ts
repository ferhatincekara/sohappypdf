import { describe, expect, test } from "bun:test";
import { compactAgeFrom, compactRemainingFrom } from "./format-compact-age";

describe("compactAgeFrom", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  test("uses just now for sub-minute ages", () => {
    expect(compactAgeFrom("2026-08-24T11:59:30.000Z", now)).toEqual({
      unit: "justNow",
      count: 0,
    });
  });

  test("uses minutes under one hour", () => {
    expect(compactAgeFrom("2026-08-24T11:48:00.000Z", now)).toEqual({
      unit: "minutes",
      count: 12,
    });
  });

  test("uses hours at or above one hour", () => {
    expect(compactAgeFrom("2026-08-24T11:00:00.000Z", now)).toEqual({
      unit: "hours",
      count: 1,
    });
  });
});

describe("compactRemainingFrom", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  test("returns null after expiration", () => {
    expect(compactRemainingFrom("2026-08-24T11:50:00.000Z", now)).toBeNull();
  });

  test("uses minutes under one hour remaining", () => {
    expect(compactRemainingFrom("2026-08-24T12:18:00.000Z", now)).toEqual({
      unit: "minutes",
      count: 18,
    });
  });

  test("promotes 60 rounded minutes to one hour", () => {
    expect(compactRemainingFrom("2026-08-24T12:59:40.000Z", now)).toEqual({
      unit: "hours",
      count: 1,
    });
  });

  test("uses hours at or above one hour remaining", () => {
    expect(compactRemainingFrom("2026-08-24T13:20:00.000Z", now)).toEqual({
      unit: "hours",
      count: 1,
    });
  });

  test("rounds nearly two hours remaining up to two hours", () => {
    expect(compactRemainingFrom("2026-08-24T13:56:00.000Z", now)).toEqual({
      unit: "hours",
      count: 2,
    });
  });
});
