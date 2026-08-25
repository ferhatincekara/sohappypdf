import { cache } from "react";
import { AdminApiError, fetchAdminMe } from "./admin-api";
import type { AdminActor } from "./admin-types";

export const getAdminActor = cache(async (): Promise<AdminActor | null> => {
  try {
    return await fetchAdminMe();
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
});
