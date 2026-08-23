import type { Logger } from "@repo/logger";
import type { RequestIdentity } from "./auth/request-identity.js";

export type AppEnv = {
  Variables: {
    requestId: string;
    identity: RequestIdentity;
    logger: Logger;
  };
};
