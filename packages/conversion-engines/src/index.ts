import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/conversion-engines");

export type {
  ConversionEngine,
  ConversionEngineInput,
  ConversionEngineQuery,
  ConversionEngineResult,
} from "./engine.js";
export { outputFilename, outputMimeType } from "./engine.js";
export type { ConversionEngineConfig } from "./engine-config.js";
export {
  CONVERSION_NATIVE_BINARIES,
  DEFAULT_CONVERSION_ENGINE_CONFIG,
} from "./engine-config.js";
export { createImagePdfEngine } from "./engines/image/image-pdf-engine.js";
export { createOfficeEngine } from "./engines/libreoffice/office-engine.js";
export { createPdfImageEngine } from "./engines/pdf/pdf-image-engine.js";
export { createPdfManipulateEngine } from "./engines/pdf/pdf-manipulate-engine.js";
export { createPdfTextEngine } from "./engines/pdf/pdf-text-engine.js";
export {
  conversionTimeoutError,
  invalidInputError,
  isPermanentConversionError,
  isRetryableConversionError,
  nativeToolFailureError,
  outputValidationError,
  PermanentConversionError,
  toSafeFailure,
  unsupportedConversionError,
} from "./errors.js";
export type { NativeBinaryProbe } from "./native-binary.js";
export {
  assertRequiredConversionBinaries,
  isConversionBinaryAvailable,
  probeConversionBinary,
  requiredConversionBinaries,
  versionArgsForBinary,
} from "./native-binary.js";
export { validateConversionOutput } from "./output-validation.js";
export type {
  RunAllowedCommand,
  RunCommandInput,
  RunProcessResult,
} from "./process/run-process.js";
export { runAllowedCommand, runChildProcess } from "./process/run-process.js";
export type { EngineRegistry, EngineResolveInput } from "./registry.js";
export { createEngineRegistry } from "./registry.js";
export type { ConversionWorkspace } from "./workspace/temp-workspace.js";
export {
  assertPathInside,
  createConversionWorkspace,
  createJobTempDirectory,
  getWorkerTempRoot,
  joinJobPath,
  removeJobTempDirectory,
} from "./workspace/temp-workspace.js";
