import type { PdfPage, PdfPageRotation } from "../pdf-workspace/types/pdf-page";

export const ORGANIZE_PAGE_ROTATIONS = [0, 90, 180, 270] as const;
export type OrganizePageRotation = PdfPageRotation;

export type OrganizeSlot = {
  id: string;
  sourcePageNumber: number;
  rotation: OrganizePageRotation;
  selected: boolean;
};

function nextSlotId(slots: readonly OrganizeSlot[]): string {
  let max = 0;

  for (const slot of slots) {
    const match = /^s(\d+)$/.exec(slot.id);

    if (match === null) {
      continue;
    }

    const value = Number.parseInt(match[1] ?? "0", 10);

    if (Number.isInteger(value) && value > max) {
      max = value;
    }
  }

  return `s${max + 1}`;
}

export function createOrganizeSlots(pageCount: number): OrganizeSlot[] {
  if (pageCount < 1) {
    return [];
  }

  return Array.from({ length: pageCount }, (_, index) => ({
    id: `s${index + 1}`,
    sourcePageNumber: index + 1,
    rotation: 0,
    selected: false,
  }));
}

export function organizeSlotsFromOrder(
  order: readonly number[],
  rotations: readonly OrganizePageRotation[] | undefined,
): OrganizeSlot[] {
  return order.map((sourcePageNumber, index) => ({
    id: `s${index + 1}`,
    sourcePageNumber,
    rotation: rotations?.[index] ?? 0,
    selected: false,
  }));
}

export function isValidOrganizeOrder(
  order: readonly number[],
  pageCount: number,
): boolean {
  return (
    order.length >= 1 &&
    order.every(
      (page) => Number.isInteger(page) && page >= 1 && page <= pageCount,
    )
  );
}

export function serializeOrganizeOrder(slots: readonly OrganizeSlot[]): string {
  return slots.map((slot) => slot.sourcePageNumber).join(", ");
}

export function serializeOrganizeRotations(
  slots: readonly OrganizeSlot[],
): string {
  if (slots.every((slot) => slot.rotation === 0)) {
    return "";
  }

  return slots.map((slot) => slot.rotation).join(", ");
}

export function selectedVisualPages(slots: readonly OrganizeSlot[]): number[] {
  return slots.flatMap((slot, index) => (slot.selected ? [index + 1] : []));
}

export function setOrganizeSelection(
  slots: readonly OrganizeSlot[],
  selectedPages: readonly number[],
): OrganizeSlot[] {
  const selected = new Set(selectedPages);

  return slots.map((slot, index) => ({
    ...slot,
    selected: selected.has(index + 1),
  }));
}

export function moveOrganizeSlot(
  slots: readonly OrganizeSlot[],
  fromIndex: number,
  toIndex: number,
): OrganizeSlot[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= slots.length ||
    toIndex >= slots.length
  ) {
    return [...slots];
  }

  const next = [...slots];
  const [moved] = next.splice(fromIndex, 1);

  if (moved === undefined) {
    return [...slots];
  }

  next.splice(toIndex, 0, moved);
  return next;
}

export function nextOrganizeRotation(
  current: OrganizePageRotation,
  delta: 90 | -90,
): OrganizePageRotation {
  const next = (((current + delta) % 360) + 360) % 360;
  return ORGANIZE_PAGE_ROTATIONS.find((rotation) => rotation === next) ?? 0;
}

export function rotateSelectedOrganizeSlots(
  slots: readonly OrganizeSlot[],
  delta: 90 | -90,
): OrganizeSlot[] {
  return slots.map((slot) =>
    slot.selected
      ? { ...slot, rotation: nextOrganizeRotation(slot.rotation, delta) }
      : slot,
  );
}

export function rotateOrganizeSlot(
  slots: readonly OrganizeSlot[],
  id: string,
  delta: 90 | -90,
): OrganizeSlot[] {
  return slots.map((slot) =>
    slot.id === id
      ? { ...slot, rotation: nextOrganizeRotation(slot.rotation, delta) }
      : slot,
  );
}

export function canDeleteSelectedOrganizeSlots(
  slots: readonly OrganizeSlot[],
): boolean {
  const selectedCount = slots.filter((slot) => slot.selected).length;
  return selectedCount > 0 && selectedCount < slots.length;
}

export function deleteSelectedOrganizeSlots(
  slots: readonly OrganizeSlot[],
): OrganizeSlot[] {
  if (!canDeleteSelectedOrganizeSlots(slots)) {
    return [...slots];
  }

  return slots.filter((slot) => !slot.selected);
}

export function canDeleteOrganizeSlot(
  slots: readonly OrganizeSlot[],
  id: string,
): boolean {
  return slots.length > 1 && slots.some((slot) => slot.id === id);
}

export function deleteOrganizeSlot(
  slots: readonly OrganizeSlot[],
  id: string,
): OrganizeSlot[] {
  if (!canDeleteOrganizeSlot(slots, id)) {
    return [...slots];
  }

  return slots.filter((slot) => slot.id !== id);
}

export function duplicateSelectedOrganizeSlots(
  slots: readonly OrganizeSlot[],
): OrganizeSlot[] {
  const next: OrganizeSlot[] = [];
  let known = [...slots];

  for (const slot of slots) {
    next.push(slot);

    if (slot.selected) {
      const copy: OrganizeSlot = {
        id: nextSlotId(known),
        sourcePageNumber: slot.sourcePageNumber,
        rotation: slot.rotation,
        selected: false,
      };
      next.push(copy);
      known = [...known, copy];
    }
  }

  return next;
}

export function organizeSlotsToPdfPages(
  slots: readonly OrganizeSlot[],
): PdfPage[] {
  return slots.map((slot, pageIndex) => ({
    id: slot.id,
    pageIndex,
    pageNumber: slot.sourcePageNumber,
    selected: slot.selected,
    rotation: slot.rotation,
  }));
}

export function hasSelectedOrganizeSlots(
  slots: readonly OrganizeSlot[],
): boolean {
  return slots.some((slot) => slot.selected);
}
