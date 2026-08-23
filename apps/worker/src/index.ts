import process from "node:process";
import { startConversionWorker } from "./start-worker.js";

const worker = startConversionWorker();

const shutdown = async (): Promise<void> => {
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});
