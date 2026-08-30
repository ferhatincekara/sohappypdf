import { describe, expect, test } from "bun:test";
import { formatBlogDate } from "@/features/blog/lib/format-blog-date";

describe("formatBlogDate", () => {
  test("formats the reference post dates without a timezone shift", () => {
    expect(formatBlogDate("2026-08-02", "en")).toBe("2 August 2026");
    expect(formatBlogDate("2026-08-02", "tr")).toBe("2 Ağustos 2026");
    expect(formatBlogDate("2026-08-14", "tr")).toBe("14 Ağustos 2026");
    expect(formatBlogDate("2026-08-18", "tr")).toBe("18 Ağustos 2026");
    expect(formatBlogDate("2026-08-02", "de")).toBe("2. August 2026");
    expect(formatBlogDate("2026-08-02", "ja")).toBe("2026年8月2日");
    expect(formatBlogDate("2026-08-02", "pt-BR")).toBe("2 de agosto de 2026");
  });
});
