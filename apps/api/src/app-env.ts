import type { Logger } from "@repo/logger";
import type { AdminActor } from "./admin/admin-actor.js";
import type { RequestIdentity } from "./auth/request-identity.js";

export type AppEnv = {
  Variables: {
    requestId: string;
    identity: RequestIdentity;
    logger: Logger;
    adminActor?: AdminActor;
  };
};
