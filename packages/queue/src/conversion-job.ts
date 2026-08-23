import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  CONVERSION_JOB_NAME,
  CONVERSION_QUEUE_SETTINGS,
} from "./queue-settings.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_OBJECT_KEY_LENGTH = 1024;
const MAX_FIELD_LENGTH = 64;
const MAX_OPTIONS_JSON_BYTES = 8 * 1024;
const OBJECT_KEY_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
const FIELD_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const SENSITIVE_OPTION_KEYS = new Set([
  "password",
  "userpassword",
  "ownerpassword",
  "secret",
  "token",
  "credential",
  "credentials",
  "accesskey",
  "secretaccesskey",
]);
const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "body",
  "buffer",
  "content",
  "credentials",
  "downloadurl",
  "file",
  "filecontents",
  "password",
  "secret",
  "uploadurl",
  "url",
]);

export type ConversionJobData = {
  conversionId: string;
  sourceFileId: string;
  sourceObjectKey: string;
  conversionType: string;
  sourceFormat: string;
  targetFormat: string;
  options: Record<string, unknown>;
};

export type ConversionJobOptions = {
  jobId: string;
  attempts: number;
  backoff: {
    type: "exponential";
    delay: number;
  };
  removeOnComplete: {
    count: number;
    age: number;
  };
  removeOnFail: {
    count: number;
    age: number;
  };
};

export type ConversionJob = {
  name: typeof CONVERSION_JOB_NAME;
  data: ConversionJobData;
  opts: ConversionJobOptions;
};

function invalidPayload(): AppError {
  return new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Invalid conversion job payload",
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

function assertUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw invalidPayload();
  }

  return value;
}

function assertField(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_FIELD_LENGTH ||
    !FIELD_PATTERN.test(value) ||
    hasControlCharacter(value)
  ) {
    throw invalidPayload();
  }

  return value;
}

function assertObjectKey(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidPayload();
  }

  if (
    value.length === 0 ||
    value.length > MAX_OBJECT_KEY_LENGTH ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("://")
  ) {
    throw invalidPayload();
  }

  for (const segment of value.split("/")) {
    if (
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      !OBJECT_KEY_SEGMENT_PATTERN.test(segment)
    ) {
      throw invalidPayload();
    }
  }

  return value;
}

function assertOptions(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw invalidPayload();
  }

  for (const key of Object.keys(value)) {
    if (SENSITIVE_OPTION_KEYS.has(key.toLowerCase())) {
      throw invalidPayload();
    }
  }

  const serialized = JSON.stringify(value);

  if (serialized === undefined || serialized.length > MAX_OPTIONS_JSON_BYTES) {
    throw invalidPayload();
  }

  return value;
}

export function createConversionJobId(conversionId: string): string {
  return assertUuid(conversionId);
}

export function parseConversionJobData(value: unknown): ConversionJobData {
  if (!isRecord(value)) {
    throw invalidPayload();
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key.toLowerCase())) {
      throw invalidPayload();
    }
  }

  return {
    conversionId: assertUuid(value.conversionId),
    sourceFileId: assertUuid(value.sourceFileId),
    sourceObjectKey: assertObjectKey(value.sourceObjectKey),
    conversionType: assertField(value.conversionType),
    sourceFormat: assertField(value.sourceFormat),
    targetFormat: assertField(value.targetFormat),
    options: assertOptions(value.options ?? {}),
  };
}

export function createConversionJob(input: ConversionJobData): ConversionJob {
  const data = parseConversionJobData(input);

  return {
    name: CONVERSION_JOB_NAME,
    data,
    opts: {
      jobId: createConversionJobId(data.conversionId),
      attempts: CONVERSION_QUEUE_SETTINGS.attempts,
      backoff: {
        type: CONVERSION_QUEUE_SETTINGS.backoff.type,
        delay: CONVERSION_QUEUE_SETTINGS.backoff.delay,
      },
      removeOnComplete: {
        count: CONVERSION_QUEUE_SETTINGS.removeOnComplete.count,
        age: CONVERSION_QUEUE_SETTINGS.removeOnComplete.age,
      },
      removeOnFail: {
        count: CONVERSION_QUEUE_SETTINGS.removeOnFail.count,
        age: CONVERSION_QUEUE_SETTINGS.removeOnFail.age,
      },
    },
  };
}
