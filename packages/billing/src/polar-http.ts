import type { PolarServer } from "@sohappypdf/config";

export class PolarHttpError extends Error {
  readonly statusCode: number;
  readonly body: string;
  readonly error?: string;

  constructor(statusCode: number, body: string, error?: string) {
    super(`Polar HTTP ${statusCode}`);
    this.name = "PolarHttpError";
    this.statusCode = statusCode;
    this.body = body;
    this.error = error;
  }
}

const POLAR_HOSTS = {
  production: "https://api.polar.sh",
  sandbox: "https://sandbox-api.polar.sh",
} as const;

function readJson(text: string): unknown {
  if (text.length === 0) {
    return undefined;
  }

  return JSON.parse(text);
}

function readPolarError(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return undefined;
  }

  return typeof body.error === "string" ? body.error : undefined;
}

export async function polarApiJson(input: {
  accessToken: string;
  server: PolarServer;
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
}): Promise<unknown> {
  const response = await fetch(`${POLAR_HOSTS[input.server]}${input.path}`, {
    method: input.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });

  const text = await response.text();
  const parsed = (() => {
    try {
      return readJson(text);
    } catch {
      return undefined;
    }
  })();

  if (!response.ok) {
    throw new PolarHttpError(response.status, text, readPolarError(parsed));
  }

  return parsed;
}
