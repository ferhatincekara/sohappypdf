"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AUTH_PATHS } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";

export function AuthInvalidTokenNotice({
  message,
  loginLabel,
}: {
  message: string;
  loginLabel: string;
}) {
  useEffect(() => {
    toast.error(message);
  }, [message]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      <Link
        href={AUTH_PATHS.login}
        className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
      >
        {loginLabel}
      </Link>
    </div>
  );
}
