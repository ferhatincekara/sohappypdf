import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { redirectIfAuthenticated } from "@/features/auth/session/redirect-if-authenticated";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");

  return {
    title: t("title"),
  };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await redirectIfAuthenticated(next);
  const t = await getTranslations("auth.register");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      variant="register"
    >
      <RegisterForm next={next} />
    </AuthPageShell>
  );
}
