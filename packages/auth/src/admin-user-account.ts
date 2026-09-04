import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { type Database, getDb, user } from "@sohappypdf/db";
import { eq } from "drizzle-orm";
import {
  type AdminUserAccess,
  findUserAccess,
  isUserRole,
} from "./admin-authorization.js";

export async function setUserSuspended(input: {
  userId: string;
  actorUserId: string;
  reason: string;
  database?: Database;
}): Promise<AdminUserAccess> {
  const reason = input.reason.trim();

  if (reason.length < 8 || reason.length > 500) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "A reason between 8 and 500 characters is required",
    });
  }

  if (input.userId === input.actorUserId) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Administrators cannot suspend their own account",
    });
  }

  const database = input.database ?? getDb();
  const existing = await findUserAccess(input.userId, database);

  if (existing === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "User not found",
    });
  }

  if (existing.role === "admin") {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Administrator accounts cannot be suspended from the console",
    });
  }

  const now = new Date();
  const [row] = await database
    .update(user)
    .set({
      suspendedAt: now,
      suspendedReason: reason,
      updatedAt: now,
    })
    .where(eq(user.id, input.userId))
    .returning({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
    });

  if (row === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "User not found",
    });
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

export async function restoreUserAccount(input: {
  userId: string;
  database?: Database;
}): Promise<AdminUserAccess> {
  const database = input.database ?? getDb();
  const existing = await findUserAccess(input.userId, database);

  if (existing === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "User not found",
    });
  }

  const now = new Date();
  const [row] = await database
    .update(user)
    .set({
      suspendedAt: null,
      suspendedReason: null,
      updatedAt: now,
    })
    .where(eq(user.id, input.userId))
    .returning({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
    });

  if (row === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "User not found",
    });
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
