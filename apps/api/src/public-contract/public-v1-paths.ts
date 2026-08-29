/** Public HTTP prefix on the API host (`https://api.example.com/v1`). */
export const PUBLIC_API_PREFIX = "/v1";

export const PUBLIC_API_PRODUCTION_ORIGIN = "https://api.sohappypdf.com";

export const PUBLIC_V1_PATHS = {
  health: `${PUBLIC_API_PREFIX}/health`,
  openapi: `${PUBLIC_API_PREFIX}/openapi.json`,
  filesUpload: `${PUBLIC_API_PREFIX}/files/upload`,
  files: `${PUBLIC_API_PREFIX}/files`,
  file: `${PUBLIC_API_PREFIX}/files/{id}`,
  fileComplete: `${PUBLIC_API_PREFIX}/files/{id}/complete`,
  fileDownload: `${PUBLIC_API_PREFIX}/files/{id}/download`,
  conversions: `${PUBLIC_API_PREFIX}/conversions`,
  conversion: `${PUBLIC_API_PREFIX}/conversions/{id}`,
  conversionCancel: `${PUBLIC_API_PREFIX}/conversions/{id}/cancel`,
} as const;

export type PublicV1Path =
  (typeof PUBLIC_V1_PATHS)[keyof typeof PUBLIC_V1_PATHS];
