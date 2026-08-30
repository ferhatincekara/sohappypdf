import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { buildAuthPageMetadata } from "@/features/auth/lib/auth-page-metadata";
import { AUTH_PATHS } from "@/features/auth/paths";
import { redirectIfAuthenticated } from "@/features/auth/session/redirect-if-authenticated";

export async function generateMetadata(): Promise<Metadata> {
  return buildAuthPageMetadata({
    page: "login",
    path: AUTH_PATHS.login,
  });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  await redirectIfAuthenticated(next);
  const t = await getTranslations("auth.login");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      variant="login"
    >
      <LoginForm next={next} oauthError={error} />
    </AuthPageShell>
  );
}
