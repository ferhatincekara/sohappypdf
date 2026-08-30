import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { buildAuthPageMetadata } from "@/features/auth/lib/auth-page-metadata";
import { AUTH_PATHS } from "@/features/auth/paths";
import { redirectIfAuthenticated } from "@/features/auth/session/redirect-if-authenticated";

export async function generateMetadata(): Promise<Metadata> {
  return buildAuthPageMetadata({
    page: "register",
    path: AUTH_PATHS.signup,
  });
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  await redirectIfAuthenticated(next);
  const t = await getTranslations("auth.register");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      variant="register"
    >
      <RegisterForm next={next} oauthError={error} />
    </AuthPageShell>
  );
}
