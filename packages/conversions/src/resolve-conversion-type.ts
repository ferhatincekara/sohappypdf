import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  findImplementedConversionTypes,
  isConversionImplemented,
  isConversionSupported,
  isTargetFormatAccepted,
} from "./conversion-capability.js";
import type { FileFormat } from "./conversion-format.js";
import type { ConversionType } from "./conversion-type.js";
import { assertConversionType } from "./conversion-validation.js";

export function resolveImplementedConversionType(
  sourceFormat: FileFormat,
  targetFormat: FileFormat,
  requestedType?: string,
): ConversionType {
  if (requestedType !== undefined) {
    const type = assertConversionType(requestedType);

    if (
      !isConversionImplemented(type) ||
      !isConversionSupported(type, sourceFormat, targetFormat)
    ) {
      if (!isTargetFormatAccepted(type, targetFormat)) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid target format",
        });
      }

      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Unsupported conversion",
      });
    }

    return type;
  }

  const implemented = findImplementedConversionTypes(
    sourceFormat,
    targetFormat,
  );

  if (implemented.length === 1) {
    const type = implemented[0];

    if (type !== undefined) {
      return type;
    }
  }

  throw new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Unsupported conversion",
  });
}
