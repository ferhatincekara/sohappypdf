export const PUBLIC_V1_PATHS = {
  health: "/api/v1/health",
  openapi: "/api/v1/openapi.json",
  filesUpload: "/api/v1/files/upload",
  files: "/api/v1/files",
  file: "/api/v1/files/{id}",
  fileComplete: "/api/v1/files/{id}/complete",
  fileDownload: "/api/v1/files/{id}/download",
  conversions: "/api/v1/conversions",
  conversion: "/api/v1/conversions/{id}",
  conversionCancel: "/api/v1/conversions/{id}/cancel",
} as const;

export type PublicV1Path =
  (typeof PUBLIC_V1_PATHS)[keyof typeof PUBLIC_V1_PATHS];
