import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthInvalidTokenNotice } from "@/features/auth/components/auth-invalid-token-notice";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.resetPassword");

  return {
    title: t("title"),
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth.resetPassword");
  const token = typeof params.token === "string" ? params.token : undefined;
  const hasValidToken =
    token !== undefined && token.length > 0 && params.error !== "INVALID_TOKEN";

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      variant="reset"
    >
      {hasValidToken && token !== undefined ? (
        <ResetPasswordForm token={token} />
      ) : (
        <AuthInvalidTokenNotice
          message={t("invalidToken")}
          loginLabel={t("loginLink")}
        />
      )}
    </AuthPageShell>
  );
}
