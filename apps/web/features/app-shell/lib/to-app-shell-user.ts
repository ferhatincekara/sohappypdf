import { gravatarUrl } from "@/features/app-shell/lib/gravatar-url";
import type { AppShellUser } from "@/features/app-shell/types";

export function toAppShellUser(user: {
  name: string;
  email: string;
}): AppShellUser {
  return {
    name: user.name,
    email: user.email,
    imageUrl: gravatarUrl(user.email),
  };
}
