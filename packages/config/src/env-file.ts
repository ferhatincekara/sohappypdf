import { existsSync, readFileSync } from "node:fs";

function stripMatchingQuotes(value: string): string {
  const quote = value.at(0);

  if (
    (quote === '"' || quote === "'") &&
    value.endsWith(quote) &&
    value.length >= 2
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvLine(
  line: string,
): { key: string; value: string } | undefined {
  const trimmed = line.trim();

  if (trimmed === "" || trimmed.startsWith("#")) {
    return undefined;
  }

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separatorIndex = withoutExport.indexOf("=");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const key = withoutExport.slice(0, separatorIndex).trim();

  if (key === "") {
    return undefined;
  }

  return {
    key,
    value: stripMatchingQuotes(withoutExport.slice(separatorIndex + 1).trim()),
  };
}

export function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");

  for (const line of contents.split("\n")) {
    const parsed = parseEnvLine(line);

    if (parsed === undefined) {
      continue;
    }

    const existing = process.env[parsed.key];

    if (existing !== undefined && existing.trim() !== "") {
      continue;
    }

    process.env[parsed.key] = parsed.value;
  }
}
