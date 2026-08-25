const REDACTED = "[redacted]";
const BINARY = "[binary]";
const CIRCULAR = "[circular]";

const SENSITIVE_KEY_PATTERN =
  /password|passwd|pwd|secret|token|api[_-]?key|authorization|cookie|credential|database[_-]?url|db[_-]?url|connection[_-]?string|aws[_-]?(access|secret|session)|signed[_-]?url|presigned[_-]?url|private[_-]?key|object[_-]?key|s3[_-]?key/i;

const SENSITIVE_URL_PATTERN =
  /X-Amz-Signature|X-Amz-Credential|X-Goog-Signature|Signature=/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function isSensitiveUrl(value: string): boolean {
  return SENSITIVE_URL_PATTERN.test(value);
}

function isBinary(value: unknown): boolean {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    return isSensitiveUrl(value) ? REDACTED : value;
  }

  if (isBinary(value)) {
    return BINARY;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }

  const result: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactValue(nested, seen);
  }

  return result;
}

export function redactFields(
  fields: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const seen = new WeakSet<object>();
  const result: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(fields)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactValue(nested, seen);
  }

  return result;
}
