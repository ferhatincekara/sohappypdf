import { spawnSync } from "node:child_process";

export function isConversionBinaryAvailable(command: string): boolean {
  const result = spawnSync("which", [command], {
    encoding: "utf8",
    timeout: 3_000,
  });

  return result.status === 0 && result.stdout.trim().length > 0;
}
