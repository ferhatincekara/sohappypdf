import { spawnSync } from "node:child_process";
import process from "node:process";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { ConversionEngineConfig } from "./engine-config.js";

const VERSION_FLAGS: Record<string, readonly string[]> = {
  soffice: ["--version"],
  libreoffice: ["--version"],
  pdftoppm: ["-v"],
  pdftotext: ["-v"],
  gs: ["--version"],
  qpdf: ["--version"],
};

export type NativeBinaryProbe = {
  command: string;
  available: boolean;
  version?: string;
};

export function versionArgsForBinary(command: string): readonly string[] {
  return VERSION_FLAGS[command] ?? ["--version"];
}

export function requiredConversionBinaries(
  config: ConversionEngineConfig,
): readonly string[] {
  return [
    config.libreOfficeBin,
    config.pdftoppmBin,
    config.pdftotextBin,
    config.ghostscriptBin,
  ];
}

export function optionalConversionBinaries(
  config: ConversionEngineConfig,
): readonly string[] {
  return [config.qpdfBin];
}

export function isConversionBinaryAvailable(command: string): boolean {
  return probeConversionBinary(command).available;
}

export function probeConversionBinary(command: string): NativeBinaryProbe {
  if (!/^[A-Za-z0-9._-]+$/.test(command)) {
    return { command, available: false };
  }

  const result = spawnSync(command, [...versionArgsForBinary(command)], {
    encoding: "utf8",
    timeout: 5_000,
    shell: false,
    env: {
      PATH: process.env.PATH,
      LANG: "C.UTF-8",
    },
  });

  if (result.error !== undefined) {
    return { command, available: false };
  }

  const output = `${result.stdout}\n${result.stderr}`.trim();
  const firstLine = output.split("\n")[0]?.trim();

  if (result.status !== 0 && firstLine === undefined) {
    return { command, available: false };
  }

  return {
    command,
    available: true,
    version:
      firstLine === undefined || firstLine.length === 0
        ? undefined
        : firstLine.slice(0, 200),
  };
}

export function assertRequiredConversionBinaries(
  config: ConversionEngineConfig,
): NativeBinaryProbe[] {
  const probes = requiredConversionBinaries(config).map(probeConversionBinary);
  const missing = probes.filter((probe) => !probe.available);

  if (missing.length > 0) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Required conversion binary is missing: ${missing
        .map((probe) => probe.command)
        .join(", ")}`,
    });
  }

  return probes;
}
