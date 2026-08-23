import process from "node:process";
import { isAppError } from "@repo/core";
import { createLogger } from "@repo/logger";
import { startConversionWorkerRuntime } from "./start-worker.js";

const logger = createLogger({
  name: "worker",
  format: "json",
});

try {
  const runtime = await startConversionWorkerRuntime();

  const onSignal = (signal: NodeJS.Signals): void => {
    void runtime.shutdown(signal).then((code) => {
      process.exit(code);
    });
  };

  process.on("SIGTERM", () => {
    onSignal("SIGTERM");
  });
  process.on("SIGINT", () => {
    onSignal("SIGINT");
  });
} catch (error) {
  logger.error("worker startup failed", {
    code: isAppError(error) ? error.code : "INTERNAL_ERROR",
    reason: isAppError(error) ? error.message : "An unexpected error occurred",
  });
  process.exit(1);
}
