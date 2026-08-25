import { redirect } from "next/navigation";
import { AdminApiError } from "./admin-api";
import type { AdminActor } from "./admin-types";
import { getAdminActor } from "./get-admin-actor";

export async function requireAdminPage(): Promise<AdminActor> {
  try {
    const actor = await getAdminActor();

    if (actor === null) {
      redirect("/login");
    }

    return actor;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      redirect("/forbidden");
    }

    throw error;
  }
}
