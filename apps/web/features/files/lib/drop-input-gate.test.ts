import { describe, expect, test } from "bun:test";
import {
  createDropInputGate,
  listSelectedFiles,
} from "@/features/files/lib/drop-input-gate";

function pdf(name: string): File {
  return new File([new Uint8Array(4)], name, { type: "application/pdf" });
}

describe("drop input gate", () => {
  test("copies FileList and arrays into a stable File array", () => {
    const file = pdf("report.pdf");

    expect(listSelectedFiles([file])).toEqual([file]);
    expect(listSelectedFiles(null)).toEqual([]);
  });

  test("ignores the file input change that follows a drop on the same control", async () => {
    const gate = createDropInputGate();
    const dropped = pdf("report.pdf");

    expect(gate.captureDrop([dropped])).toEqual([dropped]);
    expect(gate.captureInput([dropped])).toEqual([]);

    await Promise.resolve();

    expect(gate.captureInput([dropped])).toEqual([dropped]);
  });
});
