import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { buildAuthPageMetadata } from "@/features/auth/lib/auth-page-metadata";
import { AUTH_PATHS } from "@/features/auth/paths";

export async function generateMetadata(): Promise<Metadata> {
  return buildAuthPageMetadata({
    page: "forgotPassword",
    path: AUTH_PATHS.forgotPassword,
  });
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      variant="reset"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
