import { DEFAULT_PLAN_LIMITS } from "@repo/billing";
import { DEFAULT_FILE_RETENTION_HOURS } from "@repo/config";
import {
  CONVERSION_STATUSES,
  CONVERSION_TYPES,
  FILE_FORMATS,
  listConversionCapabilities,
  listSupportedUploadMimeTypes,
} from "@repo/conversions";
import { APP_ERROR_CODES, APP_ERROR_STATUS } from "@repo/core";
import { FILE_STATUSES } from "@repo/files";
import {
  PUBLIC_API_PRODUCTION_ORIGIN,
  PUBLIC_V1_PATHS,
} from "./public-v1-paths.js";

export const DOCUMENTED_PRESIGN_EXPIRES_IN_SECONDS = 15 * 60;

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

export const PUBLIC_API_VERSION = "1.0.0";
export const PUBLIC_API_TITLE = "SoHappyPDF API";

type JsonSchema = Record<string, unknown>;
type OpenApiPathItem = Record<string, unknown>;

export type OpenApiDocument = {
  openapi: "3.1.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  components: {
    securitySchemes: Record<string, JsonSchema>;
    schemas: Record<string, JsonSchema>;
  };
  security: Array<Record<string, string[]>>;
  paths: Record<string, OpenApiPathItem>;
};

function formatBytes(bytes: number): string {
  if (bytes % GIB === 0) {
    return `${bytes / GIB} GB`;
  }

  if (bytes % MIB === 0) {
    return `${bytes / MIB} MB`;
  }

  return `${bytes} bytes`;
}

function implementedConversionTypes(): string[] {
  return listConversionCapabilities()
    .filter((capability) => capability.implemented)
    .map((capability) => capability.type);
}

function errorSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["error"],
    properties: {
      error: {
        type: "object",
        additionalProperties: false,
        required: ["code", "message", "requestId"],
        properties: {
          code: {
            type: "string",
            enum: Object.values(APP_ERROR_CODES),
          },
          message: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  };
}

function errorResponse(description: string, codes: string[]): JsonSchema {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        examples: {
          default: {
            value: {
              error: {
                code: codes[0],
                message: description,
                requestId: "req_example",
              },
            },
          },
        },
      },
    },
  };
}

function authErrorResponses(): Record<string, JsonSchema> {
  return {
    "401": errorResponse("Missing or invalid API key.", [
      APP_ERROR_CODES.UNAUTHORIZED,
    ]),
    "403": errorResponse(
      "Authenticated but not allowed to perform this action.",
      [
        APP_ERROR_CODES.FORBIDDEN,
        APP_ERROR_CODES.PLAN_LIMIT_REACHED,
        APP_ERROR_CODES.STORAGE_LIMIT_REACHED,
      ],
    ),
    "429": errorResponse(
      "Rate limit exceeded. Retry after the indicated delay.",
      [APP_ERROR_CODES.RATE_LIMITED],
    ),
    "500": errorResponse("Unexpected server error.", [
      APP_ERROR_CODES.INTERNAL_ERROR,
    ]),
  };
}

function localServerUrl(): string {
  return "http://localhost:3001";
}

export function createOpenApiDocument(): OpenApiDocument {
  const implementedTypes = implementedConversionTypes();
  const uploadMimeTypes = listSupportedUploadMimeTypes();

  return {
    openapi: "3.1.0",
    info: {
      title: PUBLIC_API_TITLE,
      version: PUBLIC_API_VERSION,
      description: [
        "Public developer API for SoHappyPDF file upload and asynchronous conversion.",
        "",
        "Authenticate with `Authorization: Bearer YOUR_API_KEY`.",
        "Never put API keys in URLs, browser JavaScript, or source control.",
        "",
        "Conversions are asynchronous. Create a conversion, poll its status, then download the result file.",
        `Temporary files expire after about ${DEFAULT_FILE_RETENTION_HOURS} hours.`,
        `Presigned upload and download URLs expire after ${DOCUMENTED_PRESIGN_EXPIRES_IN_SECONDS} seconds.`,
        "",
        "Plan defaults from the entitlement catalog:",
        `- Free: ${String(DEFAULT_PLAN_LIMITS.free.operationsPerDay)} conversions/day, ${formatBytes(DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes)} max file, ${String(DEFAULT_PLAN_LIMITS.free.maxFilesPerOperation)} file per operation, ${String(DEFAULT_PLAN_LIMITS.free.maxPagesPerFile)} pages per file, ${DEFAULT_PLAN_LIMITS.free.apiRequestsPerMinute} API requests/minute.`,
        `- Pro: unlimited conversions, ${formatBytes(DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes)} max file, ${DEFAULT_PLAN_LIMITS.pro.apiRequestsPerMinute} API requests/minute.`,
        "",
        "API key and billing management stay in the dashboard. They are not part of this public key-authenticated surface.",
        "Developer webhooks are not available in this version.",
      ].join("\n"),
    },
    servers: [
      {
        url: localServerUrl(),
        description: "Local development API host.",
      },
      {
        url: PUBLIC_API_PRODUCTION_ORIGIN,
        description:
          "Production API host. The public API is not served at the marketing origin under /api.",
      },
    ],
    tags: [
      { name: "Health", description: "Liveness checks." },
      {
        name: "Files",
        description: "Presigned upload, metadata, and download.",
      },
      {
        name: "Conversions",
        description: "Asynchronous conversion jobs.",
      },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API key",
          description:
            "Dashboard-issued API key. Send `Authorization: Bearer YOUR_API_KEY`. Do not use query parameters.",
        },
      },
      schemas: {
        Error: errorSchema(),
        FileStatus: {
          type: "string",
          enum: [...FILE_STATUSES],
        },
        ConversionStatus: {
          type: "string",
          enum: [...CONVERSION_STATUSES],
        },
        FileFormat: {
          type: "string",
          enum: [...FILE_FORMATS],
        },
        ConversionType: {
          type: "string",
          enum: [...CONVERSION_TYPES],
          description: `Implemented types: ${implementedTypes.join(", ")}.`,
        },
        PublicFile: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "filename",
            "contentType",
            "size",
            "status",
            "createdAt",
            "updatedAt",
            "expiresAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            filename: { type: "string" },
            contentType: { type: "string" },
            size: { type: "integer", minimum: 1 },
            status: { $ref: "#/components/schemas/FileStatus" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        UploadIntent: {
          type: "object",
          additionalProperties: false,
          required: ["file", "upload"],
          properties: {
            file: { $ref: "#/components/schemas/PublicFile" },
            upload: {
              type: "object",
              additionalProperties: false,
              required: ["url", "method", "headers", "expiresInSeconds"],
              properties: {
                url: { type: "string", format: "uri" },
                method: { type: "string", enum: ["PUT"] },
                headers: {
                  type: "object",
                  additionalProperties: false,
                  required: ["Content-Type"],
                  properties: {
                    "Content-Type": { type: "string" },
                  },
                },
                expiresInSeconds: { type: "integer", minimum: 1 },
              },
            },
          },
        },
        CreateUploadIntentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["filename", "contentType", "size"],
          properties: {
            filename: { type: "string", minLength: 1, maxLength: 255 },
            contentType: {
              type: "string",
              enum: uploadMimeTypes,
            },
            size: { type: "integer", minimum: 1 },
          },
        },
        DownloadUrl: {
          type: "object",
          additionalProperties: false,
          required: ["download"],
          properties: {
            download: {
              type: "object",
              additionalProperties: false,
              required: ["url", "expiresInSeconds"],
              properties: {
                url: { type: "string", format: "uri" },
                expiresInSeconds: { type: "integer", minimum: 1 },
              },
            },
          },
        },
        PublicConversion: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "status",
            "sourceFileId",
            "sourceFilename",
            "outputFileId",
            "type",
            "sourceFormat",
            "targetFormat",
            "createdAt",
            "updatedAt",
            "queuedAt",
            "startedAt",
            "completedAt",
            "expiresAt",
            "expired",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            status: { $ref: "#/components/schemas/ConversionStatus" },
            sourceFileId: { type: "string", format: "uuid" },
            sourceFilename: { type: ["string", "null"] },
            outputFileId: { type: ["string", "null"], format: "uuid" },
            type: { $ref: "#/components/schemas/ConversionType" },
            sourceFormat: { $ref: "#/components/schemas/FileFormat" },
            targetFormat: { $ref: "#/components/schemas/FileFormat" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            queuedAt: { type: ["string", "null"], format: "date-time" },
            startedAt: { type: ["string", "null"], format: "date-time" },
            completedAt: { type: ["string", "null"], format: "date-time" },
            expiresAt: { type: ["string", "null"], format: "date-time" },
            expired: { type: "boolean" },
            error: {
              type: "object",
              additionalProperties: false,
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        CreateConversionRequest: {
          type: "object",
          additionalProperties: false,
          required: ["sourceFileId", "targetFormat"],
          properties: {
            sourceFileId: { type: "string", format: "uuid" },
            targetFormat: { $ref: "#/components/schemas/FileFormat" },
            type: { $ref: "#/components/schemas/ConversionType" },
          },
        },
      },
    },
    security: [{ apiKey: [] }],
    paths: {
      [PUBLIC_V1_PATHS.health]: {
        get: {
          tags: ["Health"],
          summary: "API liveness",
          security: [],
          responses: {
            "200": {
              description: "The API process is running.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    required: ["status"],
                    properties: { status: { type: "string", enum: ["ok"] } },
                  },
                },
              },
            },
          },
        },
      },
      [PUBLIC_V1_PATHS.openapi]: {
        get: {
          tags: ["Health"],
          summary: "OpenAPI document",
          security: [],
          responses: {
            "200": {
              description: "Machine-readable public API contract.",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      [PUBLIC_V1_PATHS.filesUpload]: {
        post: {
          tags: ["Files"],
          summary: "Create a presigned upload",
          description:
            "Creates a pending file record and a short-lived PUT URL. Upload the bytes directly to that URL, then call complete.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateUploadIntentRequest",
                },
                examples: {
                  pdf: {
                    value: {
                      filename: "report.pdf",
                      contentType: "application/pdf",
                      size: 2048,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Upload intent created. The file status is pending.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UploadIntent" },
                },
              },
            },
            "400": errorResponse("Invalid filename, content type, or size.", [
              APP_ERROR_CODES.VALIDATION_ERROR,
            ]),
            "413": errorResponse("File exceeds the current plan size limit.", [
              APP_ERROR_CODES.FILE_TOO_LARGE,
            ]),
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.files]: {
        get: {
          tags: ["Files"],
          summary: "List files",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
            },
            {
              name: "cursor",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Owned files that have not been deleted or expired.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["files", "nextCursor"],
                    properties: {
                      files: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicFile" },
                      },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.file]: {
        get: {
          tags: ["Files"],
          summary: "Get a file",
          parameters: [fileIdParameter()],
          responses: {
            "200": {
              description:
                "File metadata. Object storage keys are never returned.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["file"],
                    properties: {
                      file: { $ref: "#/components/schemas/PublicFile" },
                    },
                  },
                },
              },
            },
            "400": errorResponse("Invalid file id.", [
              APP_ERROR_CODES.VALIDATION_ERROR,
            ]),
            "404": errorResponse("File not found or not owned by the caller.", [
              APP_ERROR_CODES.NOT_FOUND,
            ]),
            "410": errorResponse(
              "The file has expired and must be processed again.",
              [APP_ERROR_CODES.FILE_EXPIRED],
            ),
            ...authErrorResponses(),
          },
        },
        delete: {
          tags: ["Files"],
          summary: "Delete a file",
          parameters: [fileIdParameter()],
          responses: {
            "200": {
              description: "The file is marked deleted.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["file"],
                    properties: {
                      file: { $ref: "#/components/schemas/PublicFile" },
                    },
                  },
                },
              },
            },
            "404": errorResponse("File not found or not owned by the caller.", [
              APP_ERROR_CODES.NOT_FOUND,
            ]),
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.fileComplete]: {
        post: {
          tags: ["Files"],
          summary: "Complete a presigned upload",
          parameters: [fileIdParameter()],
          responses: {
            "200": {
              description:
                "The file status becomes uploaded after the object exists.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["file"],
                    properties: {
                      file: { $ref: "#/components/schemas/PublicFile" },
                    },
                  },
                },
              },
            },
            "404": errorResponse("File not found or not owned by the caller.", [
              APP_ERROR_CODES.NOT_FOUND,
            ]),
            "410": errorResponse(
              "The file has expired and must be processed again.",
              [APP_ERROR_CODES.FILE_EXPIRED],
            ),
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.fileDownload]: {
        post: {
          tags: ["Files"],
          summary: "Create a temporary download URL",
          description:
            "Returns a short-lived URL for the file bytes. Use the conversion `outputFileId` to download a completed result.",
          parameters: [fileIdParameter()],
          responses: {
            "200": {
              description: "Presigned download URL.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DownloadUrl" },
                },
              },
            },
            "404": errorResponse("File not found or not owned by the caller.", [
              APP_ERROR_CODES.NOT_FOUND,
            ]),
            "410": errorResponse(
              "The file has expired and must be processed again.",
              [APP_ERROR_CODES.FILE_EXPIRED],
            ),
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.conversions]: {
        post: {
          tags: ["Conversions"],
          summary: "Create a conversion",
          description:
            "Creates a conversion record and enqueues worker processing. Returns HTTP 201 immediately. Poll GET /v1/conversions/{id} until the status is completed, failed, or cancelled. Send Idempotency-Key to avoid duplicate jobs.",
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: false,
              schema: { type: "string", minLength: 1, maxLength: 128 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateConversionRequest",
                },
                examples: {
                  pdfToPng: {
                    value: {
                      sourceFileId: "11111111-1111-4111-8111-111111111111",
                      targetFormat: "png",
                      type: "pdf-to-png",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description:
                "Conversion accepted. Status starts as pending or queued.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["conversion"],
                    properties: {
                      conversion: {
                        $ref: "#/components/schemas/PublicConversion",
                      },
                    },
                  },
                },
              },
            },
            "400": errorResponse("Invalid conversion request.", [
              APP_ERROR_CODES.VALIDATION_ERROR,
            ]),
            "404": errorResponse("Source file not found or not usable.", [
              APP_ERROR_CODES.NOT_FOUND,
            ]),
            "410": errorResponse(
              "The source file has expired and must be processed again.",
              [APP_ERROR_CODES.FILE_EXPIRED],
            ),
            "409": errorResponse(
              "The conversion conflicts with the current file or job state.",
              [APP_ERROR_CODES.CONFLICT],
            ),
            ...authErrorResponses(),
          },
        },
        get: {
          tags: ["Conversions"],
          summary: "List conversions",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1 },
            },
            { name: "cursor", in: "query", schema: { type: "string" } },
            {
              name: "status",
              in: "query",
              schema: { $ref: "#/components/schemas/ConversionStatus" },
            },
            {
              name: "targetFormat",
              in: "query",
              schema: { $ref: "#/components/schemas/FileFormat" },
            },
          ],
          responses: {
            "200": {
              description: "Owned conversions.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["conversions", "nextCursor"],
                    properties: {
                      conversions: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/PublicConversion",
                        },
                      },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.conversion]: {
        get: {
          tags: ["Conversions"],
          summary: "Get a conversion",
          parameters: [conversionIdParameter()],
          responses: {
            "200": {
              description:
                "Current conversion status. Poll while pending, queued, or processing.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["conversion"],
                    properties: {
                      conversion: {
                        $ref: "#/components/schemas/PublicConversion",
                      },
                    },
                  },
                },
              },
            },
            "404": errorResponse(
              "Conversion not found or not owned by the caller.",
              [APP_ERROR_CODES.NOT_FOUND],
            ),
            ...authErrorResponses(),
          },
        },
      },
      [PUBLIC_V1_PATHS.conversionCancel]: {
        post: {
          tags: ["Conversions"],
          summary: "Cancel a conversion",
          parameters: [conversionIdParameter()],
          responses: {
            "200": {
              description:
                "The conversion is cancelled when the current status allows it.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["conversion"],
                    properties: {
                      conversion: {
                        $ref: "#/components/schemas/PublicConversion",
                      },
                    },
                  },
                },
              },
            },
            "409": errorResponse(
              "The conversion cannot be cancelled from its current status.",
              [APP_ERROR_CODES.CONFLICT],
            ),
            "404": errorResponse(
              "Conversion not found or not owned by the caller.",
              [APP_ERROR_CODES.NOT_FOUND],
            ),
            ...authErrorResponses(),
          },
        },
      },
    },
  };
}

function fileIdParameter(): JsonSchema {
  return {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
  };
}

function conversionIdParameter(): JsonSchema {
  return fileIdParameter();
}

export function publicErrorStatus(code: keyof typeof APP_ERROR_CODES): number {
  return APP_ERROR_STATUS[APP_ERROR_CODES[code]];
}
