import { describe, expect, test } from "bun:test";
import {
  authorizationExample,
  conversionExample,
  downloadExample,
  pollExample,
  uploadExample,
} from "./example-snippets";

describe("developer examples", () => {
  test("use placeholders instead of secrets", () => {
    const apiV1BaseUrl = "http://localhost:3001/api/v1";
    const examples = [
      authorizationExample(),
      uploadExample(apiV1BaseUrl),
      conversionExample(apiV1BaseUrl),
      pollExample(apiV1BaseUrl),
      downloadExample(apiV1BaseUrl),
    ].join("\n");

    expect(examples).toContain("YOUR_API_KEY");
    expect(examples).not.toContain("shpdf_");
    expect(examples).not.toContain("polar_");
    expect(examples).not.toContain("AKIA");
  });
});
