import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  decodeConversionListCursor,
  encodeConversionListCursor,
} from "./conversion-pagination.js";
import type { ConversionRecord } from "./conversion-types.js";

const conversion: ConversionRecord = {
  id: "550e8400-e29b-41d4-a716-446655440100",
  ownerId: "user_1",
  sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
  outputFileId: null,
  type: "pdf-to-jpg",
  sourceFormat: "pdf",
  targetFormat: "jpg",
  status: "queued",
  options: { type: "pdf-to-jpg" },
  errorCode: null,
  errorMessage: null,
  idempotencyKey: null,
  createdAt: new Date("2026-08-23T18:00:00.000Z"),
  updatedAt: new Date("2026-08-23T18:00:00.000Z"),
  queuedAt: new Date("2026-08-23T18:00:00.000Z"),
  startedAt: null,
  completedAt: null,
};

describe("conversion list cursor", () => {
  test("round-trips createdAt and id", () => {
    expect(
      decodeConversionListCursor(encodeConversionListCursor(conversion)),
    ).toEqual({
      createdAt: conversion.createdAt,
      id: conversion.id,
    });
  });

  test("rejects an untrusted cursor", () => {
    try {
      decodeConversionListCursor("not-a-cursor");
      throw new Error("expected cursor to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
