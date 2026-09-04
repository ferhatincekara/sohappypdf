import { describe, expect, test } from "bun:test";
import {
  resolveToolWorkspaceKind,
  usesCanvasActionSidebar,
} from "@/features/public-tools/lib/tool-workspace-kind";

describe("resolveToolWorkspaceKind", () => {
  test("maps focused tools to specialized workspaces", () => {
    expect(resolveToolWorkspaceKind("split-pdf")).toBe("split");
    expect(resolveToolWorkspaceKind("extract-pages")).toBe("extract");
    expect(resolveToolWorkspaceKind("organize-pdf")).toBe("organize");
    expect(resolveToolWorkspaceKind("merge-pdf")).toBe("merge");
    expect(resolveToolWorkspaceKind("rotate-pdf")).toBe("rotate");
    expect(resolveToolWorkspaceKind("remove-pages")).toBe("remove");
    expect(resolveToolWorkspaceKind("compress-pdf")).toBe("compress");
    expect(resolveToolWorkspaceKind("pdf-to-word")).toBe("convert");
    expect(resolveToolWorkspaceKind("jpg-to-pdf")).toBe("imageToPdf");
    expect(resolveToolWorkspaceKind("protect-pdf")).toBe("protect");
    expect(resolveToolWorkspaceKind("unlock-pdf")).toBe("unlock");
    expect(resolveToolWorkspaceKind("watermark-pdf")).toBe("watermark");
    expect(resolveToolWorkspaceKind("crop-pdf")).toBe("crop");
    expect(resolveToolWorkspaceKind("sign-pdf")).toBe("sign");
    expect(resolveToolWorkspaceKind("edit-pdf")).toBe("edit");
    expect(resolveToolWorkspaceKind("redact-pdf")).toBe("redact");
    expect(resolveToolWorkspaceKind("repair-pdf")).toBe("repair");
    expect(resolveToolWorkspaceKind("ocr-pdf")).toBe("ocr");
  });
});

describe("usesCanvasActionSidebar", () => {
  test("keeps page-canvas tools on a dedicated action card", () => {
    expect(usesCanvasActionSidebar("split-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("extract-pages")).toBe(true);
    expect(usesCanvasActionSidebar("remove-pages")).toBe(true);
    expect(usesCanvasActionSidebar("rotate-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("organize-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("edit-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("sign-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("redact-pdf")).toBe(true);
    expect(usesCanvasActionSidebar("merge-pdf")).toBe(false);
    expect(usesCanvasActionSidebar("compress-pdf")).toBe(false);
  });
});
