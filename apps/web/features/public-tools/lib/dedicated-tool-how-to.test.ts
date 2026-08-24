import { describe, expect, test } from "bun:test";
import { dedicatedHowToForTool } from "./dedicated-tool-how-to";

describe("dedicatedHowToForTool", () => {
  test("returns dedicated how-to copy for focused tools", () => {
    expect(dedicatedHowToForTool("split-pdf")?.workspace).toBe("split");
    expect(dedicatedHowToForTool("extract-pages")?.workspace).toBe("extract");
    expect(dedicatedHowToForTool("organize-pdf")?.workspace).toBe("organize");
    expect(dedicatedHowToForTool("merge-pdf")?.workspace).toBe("merge");
    expect(dedicatedHowToForTool("rotate-pdf")?.workspace).toBe("rotate");
    expect(dedicatedHowToForTool("remove-pages")?.workspace).toBe("remove");
    expect(dedicatedHowToForTool("compress-pdf")?.workspace).toBe("compress");
    expect(dedicatedHowToForTool("pdf-to-word")?.workspace).toBe("convert");
    expect(dedicatedHowToForTool("jpg-to-pdf")?.workspace).toBe("imageToPdf");
    expect(dedicatedHowToForTool("repair-pdf")?.workspace).toBe("repair");
    expect(dedicatedHowToForTool("ocr-pdf")).toBeNull();
  });
});
