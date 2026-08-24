import { describe, expect, test } from "bun:test";
import { isLocalDevelopmentOrigin } from "./dev-cors.js";

describe("isLocalDevelopmentOrigin", () => {
  test("accepts localhost and private network origins", () => {
    expect(isLocalDevelopmentOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalDevelopmentOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalDevelopmentOrigin("http://192.168.1.51:3000")).toBe(true);
    expect(isLocalDevelopmentOrigin("http://10.0.0.12:3000")).toBe(true);
  });

  test("rejects public origins", () => {
    expect(isLocalDevelopmentOrigin("https://sohappypdf.com")).toBe(false);
    expect(isLocalDevelopmentOrigin("https://evil.example")).toBe(false);
  });
});
