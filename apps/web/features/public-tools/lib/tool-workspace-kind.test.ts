import { describe, expect, test } from "bun:test";
import { resolveToolWorkspaceKind } from "./tool-workspace-kind";

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
    expect(resolveToolWorkspaceKind("protect-pdf")).toBe("password");
    expect(resolveToolWorkspaceKind("repair-pdf")).toBe("repair");
    expect(resolveToolWorkspaceKind("edit-pdf")).toBe("default");
    expect(resolveToolWorkspaceKind("sign-pdf")).toBe("default");
    expect(resolveToolWorkspaceKind("ocr-pdf")).toBe("default");
  });
});
