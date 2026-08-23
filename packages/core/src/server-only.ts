import { APP_ERROR_CODES, AppError } from "./app-error.js";

export function assertServerOnly(packageName: string): void {
  if ("window" in globalThis) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: `${packageName} is server-only and cannot be used in client code`,
    });
  }
}
