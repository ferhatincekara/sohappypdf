import { type AdminUserAccess, requireAdminAccess } from "@sohappypdf/auth";
import { loadAdminConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { createLogger } from "@sohappypdf/logger";
import { redirect } from "next/navigation";
import { consumeAdminRateLimit } from "@/server/auth/rate-limit";
import { getAdminSession } from "@/server/auth/session";

const logger = createLogger({ name: "admin" });

export type AdminActor = AdminUserAccess;

export async function requireAdmin(): Promise<AdminActor> {
  const session = await getAdminSession();

  if (session === null) {
    redirect("/login");
  }

  try {
    const actor = await requireAdminAccess({
      userId: session.user.id,
      bootstrapUserIds: loadAdminConfig().bootstrapUserIds,
    });
    await consumeAdminRateLimit(actor.userId);
    return actor;
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === APP_ERROR_CODES.UNAUTHORIZED
    ) {
      redirect("/login");
    }

    if (error instanceof AppError && error.code === APP_ERROR_CODES.FORBIDDEN) {
      logger.warn("admin.access.denied", { userId: session.user.id });
      redirect("/forbidden");
    }

    throw error;
  }
}

export async function requireAdminAction(): Promise<AdminActor> {
  const session = await getAdminSession();

  if (session === null) {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Authentication required",
    });
  }

  const actor = await requireAdminAccess({
    userId: session.user.id,
    bootstrapUserIds: loadAdminConfig().bootstrapUserIds,
  });
  await consumeAdminRateLimit(actor.userId);
  return actor;
}
