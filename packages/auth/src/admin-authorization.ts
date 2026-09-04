import { loadAdminConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  type Database,
  getDb,
  USER_ROLES,
  type UserRole,
  user,
} from "@sohappypdf/db";
import { eq } from "drizzle-orm";

export { USER_ROLES, type UserRole };

export type AdminUserAccess = {
  userId: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  suspendedAt: Date | null;
  suspendedReason: string | null;
};

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function hasAdminRole(
  role: string,
  userId: string,
  bootstrapUserIds: readonly string[] = [],
): boolean {
  return role === "admin" || bootstrapUserIds.includes(userId);
}

export function assertUserNotSuspended(access: AdminUserAccess): void {
  if (access.suspendedAt !== null) {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Account is suspended",
    });
  }
}

export async function findUserAccess(
  userId: string,
  database: Database = getDb(),
): Promise<AdminUserAccess | undefined> {
  const [row] = await database
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (row === undefined) {
    return undefined;
  }

  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: isUserRole(row.role) ? row.role : "user",
    suspendedAt: row.suspendedAt,
    suspendedReason: row.suspendedReason,
  };
}

export async function requireAdminAccess(input: {
  userId: string;
  database?: Database;
  bootstrapUserIds?: readonly string[];
}): Promise<AdminUserAccess> {
  const access = await findUserAccess(input.userId, input.database ?? getDb());

  if (access === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.UNAUTHORIZED,
      message: "Authentication required",
    });
  }

  assertUserNotSuspended(access);

  const bootstrapUserIds =
    input.bootstrapUserIds ?? loadAdminConfig().bootstrapUserIds;

  if (!hasAdminRole(access.role, access.userId, bootstrapUserIds)) {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Administrator access required",
    });
  }

  return access;
}
