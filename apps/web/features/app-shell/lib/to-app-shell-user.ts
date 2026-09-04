import { gravatarUrl } from "@/features/app-shell/lib/gravatar-url";
import type { AppShellUser } from "@/features/app-shell/types";

export function toAppShellUser(user: {
  name: string;
  email: string;
  image?: string | null;
}): AppShellUser {
  const storedImage = user.image?.trim() ?? "";

  return {
    name: user.name,
    email: user.email,
    imageUrl: storedImage.length > 0 ? storedImage : gravatarUrl(user.email),
  };
}
