import { describe, expect, test } from "bun:test";
import { editorObjectsToEditOperations } from "@/features/public-tools/lib/edit-pdf-operations";

describe("editorObjectsToEditOperations", () => {
  test("converts overlay objects into edit-pdf operations", () => {
    expect(
      editorObjectsToEditOperations(
        [
          {
            id: "t",
            kind: "text",
            page: 1,
            x: 10,
            y: 20,
            width: 100,
            height: 16,
            rotation: 0,
            text: "Hello",
            fontSize: 14,
          },
          {
            id: "r",
            kind: "rectangle",
            page: 1,
            x: 10,
            y: 40,
            width: 80,
            height: 20,
            rotation: 0,
            style: "highlight",
          },
        ],
        { "1": 792 },
      ),
    ).toEqual([
      {
        kind: "text",
        page: 1,
        x: 10,
        y: 756,
        text: "Hello",
        size: 14,
        font: "helvetica",
      },
      {
        kind: "rectangle",
        page: 1,
        x: 10,
        y: 732,
        width: 80,
        height: 20,
        style: "highlight",
      },
    ]);
  });

  test("covers and rewrites changed original text", () => {
    const original = {
      id: "title",
      kind: "text" as const,
      page: 1,
      x: 200,
      y: 40,
      width: 120,
      height: 24,
      rotation: 0,
      text: "Sample PDF",
      fontSize: 24,
      fontFamily: "Times New Roman Bold",
      source: "original" as const,
      origin: {
        x: 200,
        y: 40,
        width: 120,
        height: 24,
        text: "Sample PDF",
        fontSize: 24,
      },
    };

    expect(
      editorObjectsToEditOperations(
        [{ ...original, text: "Edited PDF" }],
        { "1": 792 },
        [original],
      ),
    ).toMatchObject([
      { kind: "erase", page: 1 },
      { kind: "text", page: 1, text: "Edited PDF", font: "timesBold" },
    ]);

    expect(
      editorObjectsToEditOperations([original], { "1": 792 }, [original]),
    ).toBeUndefined();

    expect(
      editorObjectsToEditOperations([], { "1": 792 }, [original]),
    ).toMatchObject([{ kind: "erase", page: 1 }]);
  });

  test("returns undefined when a page height is missing or nothing can be applied", () => {
    expect(
      editorObjectsToEditOperations(
        [
          {
            id: "t",
            kind: "text",
            page: 2,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            text: "Hi",
            fontSize: 12,
          },
        ],
        { "1": 792 },
      ),
    ).toBeUndefined();

    expect(editorObjectsToEditOperations([], { "1": 792 })).toBeUndefined();
  });
});
