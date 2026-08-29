import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

export type EnvSource = Readonly<Record<string, string | undefined>>;

function readEnvValue(name: string, source: EnvSource): string | undefined {
  const value = source[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}

export function getRequiredEnv(
  name: string,
  source: EnvSource = process.env,
): string {
  const value = readEnvValue(name, source);

  if (value === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Missing required environment variable: ${name}`,
    });
  }

  return value;
}

export function getOptionalEnv(
  name: string,
  source: EnvSource = process.env,
): string | undefined {
  return readEnvValue(name, source);
}
