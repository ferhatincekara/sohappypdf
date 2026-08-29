import { describe, expect, test } from "bun:test";
import {
  authorizationExample,
  cancelExample,
  completeUploadExample,
  conversionExample,
  downloadExample,
  errorEnvelopeExample,
  pollExample,
  putUploadExample,
  uploadExample,
} from "@/features/developer-docs/lib/example-snippets";

describe("developer examples", () => {
  test("use placeholders instead of secrets", () => {
    const apiV1BaseUrl = "http://localhost:3001/v1";
    const examples = [
      authorizationExample(),
      uploadExample(apiV1BaseUrl),
      putUploadExample(),
      completeUploadExample(apiV1BaseUrl),
      conversionExample(apiV1BaseUrl),
      pollExample(apiV1BaseUrl),
      downloadExample(apiV1BaseUrl),
      cancelExample(apiV1BaseUrl),
      errorEnvelopeExample(),
    ].join("\n");

    expect(examples).toContain("YOUR_API_KEY");
    expect(examples).not.toContain("shpdf_");
    expect(examples).not.toContain("polar_");
    expect(examples).not.toContain("AKIA");
  });
});
