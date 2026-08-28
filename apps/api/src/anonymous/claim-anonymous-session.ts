import type { AnonymousSessionService } from "@repo/auth";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";

export type ClaimAnonymousSessionInput = {
  rawToken: string | undefined;
  userId: string;
  anonymousSessions: AnonymousSessionService;
  files: Pick<FileService, "transferOwner">;
  conversions: Pick<ConversionService, "transferOwner">;
  now?: Date;
};

export type ClaimAnonymousSessionResult = {
  claimed: boolean;
  cookieShouldClear: boolean;
};

export async function claimAnonymousSession(
  input: ClaimAnonymousSessionInput,
): Promise<ClaimAnonymousSessionResult> {
  if (input.rawToken === undefined || input.rawToken.length === 0) {
    return { claimed: false, cookieShouldClear: false };
  }

  const session = await input.anonymousSessions.findValidFromToken(
    input.rawToken,
    input.now,
  );

  if (session === undefined) {
    return { claimed: false, cookieShouldClear: true };
  }

  const now = input.now ?? new Date();

  await input.files.transferOwner({
    fromOwnerId: session.id,
    fromOwnerKind: "anonymous_session",
    toOwnerId: input.userId,
    toOwnerKind: "user",
    now,
  });
  await input.conversions.transferOwner({
    fromOwnerId: session.id,
    fromOwnerKind: "anonymous_session",
    toOwnerId: input.userId,
    toOwnerKind: "user",
    now,
  });

  return { claimed: true, cookieShouldClear: true };
}
