import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { redirectIfAuthenticated } from "@/features/auth/session/redirect-if-authenticated";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");

  return {
    title: t("title"),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await redirectIfAuthenticated(next);
  const t = await getTranslations("auth.login");

  return (
    <AuthPageShell title={t("title")} description={t("description")}>
      <LoginForm next={next} />
    </AuthPageShell>
  );
}
