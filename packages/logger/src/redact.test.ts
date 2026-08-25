import { describe, expect, test } from "bun:test";
import { redactFields } from "./redact.js";

describe("log redaction", () => {
  test("redacts credentials, API keys, and signed URL query strings", () => {
    const redacted = redactFields({
      password: "hunter2",
      apiKey: "shpdf_test",
      token: "session-token",
      objectKey: "files/original/abc",
      download: {
        url: "https://files.example/object?X-Amz-Signature=abc123",
      },
      safe: "merge-pdf",
    });

    expect(redacted.password).toBe("[redacted]");
    expect(redacted.apiKey).toBe("[redacted]");
    expect(redacted.token).toBe("[redacted]");
    expect(redacted.objectKey).toBe("[redacted]");
    expect(redacted.download).toEqual({ url: "[redacted]" });
    expect(redacted.safe).toBe("merge-pdf");
  });
});
