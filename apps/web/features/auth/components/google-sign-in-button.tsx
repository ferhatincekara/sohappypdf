"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/features/auth/components/google-icon";
import { useGoogleSignIn } from "@/features/auth/hooks/use-google-sign-in";
import { AUTH_PATHS } from "@/features/auth/paths";

export function GoogleSignInButton({
  next,
  errorPath = AUTH_PATHS.login,
  disabled = false,
}: {
  next?: string | null;
  errorPath?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("auth.social");
  const { signInWithGoogle, isSubmitting } = useGoogleSignIn({
    next,
    errorPath,
  });

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="outline"
        size="lg"
        slideLabel={false}
        className="w-full gap-2 border-border bg-white"
        disabled={disabled || isSubmitting}
        onClick={() => {
          void signInWithGoogle();
        }}
      >
        <GoogleIcon className="size-5" />
        {isSubmitting ? t("googleSubmitting") : t("google")}
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("or")}
        </span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
