import { getDb } from "@sohappypdf/db";
import { getFileService } from "@sohappypdf/files";
import { createConversionRepository } from "./conversion-repository.js";
import {
  type ConversionService,
  createConversionService,
} from "./conversion-service.js";

let conversionService: ConversionService | undefined;

export function getConversionService(): ConversionService {
  if (conversionService === undefined) {
    conversionService = createConversionService({
      repository: createConversionRepository(getDb()),
      files: getFileService(),
    });
  }

  return conversionService;
}
