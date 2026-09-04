import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "./engine-config.js";
import {
  assertRequiredConversionBinaries,
  optionalConversionBinaries,
  probeConversionBinary,
  requiredConversionBinaries,
  versionArgsForBinary,
} from "./native-binary.js";

describe("native binary probes", () => {
  test("uses argument arrays for version checks", () => {
    expect(versionArgsForBinary("soffice")).toEqual(["--version"]);
    expect(versionArgsForBinary("pdftoppm")).toEqual(["-v"]);
    expect(versionArgsForBinary("pdftotext")).toEqual(["-v"]);
    expect(versionArgsForBinary("pdftohtml")).toEqual(["-v"]);
    expect(versionArgsForBinary("gs")).toEqual(["--version"]);
  });

  test("lists only binaries used by implemented engines", () => {
    expect(
      requiredConversionBinaries(DEFAULT_CONVERSION_ENGINE_CONFIG),
    ).toEqual(["soffice", "pdftoppm", "pdftotext", "pdftohtml", "gs"]);
  });

  test("tracks optional binaries separately from startup requirements", () => {
    expect(
      optionalConversionBinaries(DEFAULT_CONVERSION_ENGINE_CONFIG),
    ).toEqual(["qpdf", "ocrmypdf"]);
  });

  test("does not treat a missing command as available", () => {
    expect(probeConversionBinary("sohappypdf-missing-binary").available).toBe(
      false,
    );
  });

  test("rejects unsafe command names", () => {
    expect(probeConversionBinary("soffice; rm -rf /").available).toBe(false);
    expect(probeConversionBinary("../soffice").available).toBe(false);
  });

  test("fails startup when a required binary is missing", () => {
    try {
      assertRequiredConversionBinaries({
        ...DEFAULT_CONVERSION_ENGINE_CONFIG,
        libreOfficeBin: "sohappypdf-missing-soffice",
      });
      throw new Error("expected missing binary to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
        expect(error.message).toContain("sohappypdf-missing-soffice");
      }
    }
  });
});
