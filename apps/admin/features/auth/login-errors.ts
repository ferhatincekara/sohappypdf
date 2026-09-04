export function mapAdminSignInError(
  error: {
    code?: string;
    message?: string;
  } | null,
): string {
  const code = error?.code?.toUpperCase();
  const message = error?.message?.toLowerCase() ?? "";

  if (
    code === "ACCOUNT_SUSPENDED" ||
    message.includes("account is suspended")
  ) {
    return "This account is suspended and cannot sign in.";
  }

  return "Unable to sign in with those credentials.";
}
