import { describe, expect, test } from "bun:test";
import {
  canDeleteOrganizeSlot,
  canDeleteSelectedOrganizeSlots,
  createOrganizeSlots,
  deleteOrganizeSlot,
  deleteSelectedOrganizeSlots,
  duplicateSelectedOrganizeSlots,
  isValidOrganizeOrder,
  moveOrganizeSlot,
  nextOrganizeRotation,
  organizeSlotsFromOrder,
  organizeSlotsToPdfPages,
  rotateOrganizeSlot,
  rotateSelectedOrganizeSlots,
  selectedVisualPages,
  serializeOrganizeOrder,
  serializeOrganizeRotations,
  setOrganizeSelection,
} from "./organize-pages";

describe("organize pages", () => {
  test("creates identity slots and serializes order", () => {
    const slots = createOrganizeSlots(3);
    expect(slots).toEqual([
      { id: "s1", sourcePageNumber: 1, rotation: 0, selected: false },
      { id: "s2", sourcePageNumber: 2, rotation: 0, selected: false },
      { id: "s3", sourcePageNumber: 3, rotation: 0, selected: false },
    ]);
    expect(serializeOrganizeOrder(slots)).toBe("1, 2, 3");
    expect(serializeOrganizeRotations(slots)).toBe("");
    expect(isValidOrganizeOrder([3, 1, 1], 3)).toBe(true);
    expect(isValidOrganizeOrder([4], 3)).toBe(false);
  });

  test("reorders, rotates, duplicates, and deletes slots", () => {
    const ordered = moveOrganizeSlot(createOrganizeSlots(3), 0, 2);
    expect(ordered.map((slot) => slot.sourcePageNumber)).toEqual([2, 3, 1]);

    const selected = setOrganizeSelection(ordered, [1, 3]);
    expect(selectedVisualPages(selected)).toEqual([1, 3]);

    const rotated = rotateSelectedOrganizeSlots(selected, 90);
    expect(rotated.map((slot) => slot.rotation)).toEqual([90, 0, 90]);
    expect(serializeOrganizeRotations(rotated)).toBe("90, 0, 90");
    expect(nextOrganizeRotation(270, 90)).toBe(0);

    const duplicated = duplicateSelectedOrganizeSlots(rotated);
    expect(duplicated.map((slot) => slot.sourcePageNumber)).toEqual([
      2, 2, 3, 1, 1,
    ]);
    expect(duplicated.map((slot) => slot.id)).toEqual([
      "s2",
      "s4",
      "s3",
      "s1",
      "s5",
    ]);

    expect(canDeleteSelectedOrganizeSlots(duplicated)).toBe(true);
    expect(
      canDeleteSelectedOrganizeSlots(
        setOrganizeSelection(duplicated, [1, 2, 3, 4, 5]),
      ),
    ).toBe(false);
    expect(
      deleteSelectedOrganizeSlots(duplicated).map(
        (slot) => slot.sourcePageNumber,
      ),
    ).toEqual([2, 3, 1]);

    const afterSingleRotate = rotateOrganizeSlot(
      createOrganizeSlots(2),
      "s1",
      -90,
    );
    expect(afterSingleRotate[0]?.rotation).toBe(270);
    expect(canDeleteOrganizeSlot(createOrganizeSlots(1), "s1")).toBe(false);
    expect(deleteOrganizeSlot(createOrganizeSlots(2), "s1")).toEqual([
      { id: "s2", sourcePageNumber: 2, rotation: 0, selected: false },
    ]);
  });

  test("maps slots onto the page workspace model", () => {
    const pages = organizeSlotsToPdfPages(
      organizeSlotsFromOrder([3, 1], [90, 0]),
    );
    expect(pages).toEqual([
      {
        id: "s1",
        pageIndex: 0,
        pageNumber: 3,
        selected: false,
        rotation: 90,
      },
      {
        id: "s2",
        pageIndex: 1,
        pageNumber: 1,
        selected: false,
        rotation: 0,
      },
    ]);
  });
});
