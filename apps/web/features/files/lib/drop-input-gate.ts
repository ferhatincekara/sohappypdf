export function listSelectedFiles(
  selected: FileList | File[] | null | undefined,
): File[] {
  if (selected === null || selected === undefined) {
    return [];
  }

  return Array.isArray(selected) ? [...selected] : Array.from(selected);
}

export function createDropInputGate() {
  let dropHandled = false;

  return {
    captureDrop(files: FileList | File[]): File[] {
      dropHandled = true;
      queueMicrotask(() => {
        dropHandled = false;
      });
      return listSelectedFiles(files);
    },
    captureInput(files: FileList | File[] | null): File[] {
      if (dropHandled) {
        return [];
      }

      return listSelectedFiles(files);
    },
  };
}

export type DropInputGate = ReturnType<typeof createDropInputGate>;
