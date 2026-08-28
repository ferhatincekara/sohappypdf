import type { AppShellUser } from "../types";
import { gravatarUrl } from "./gravatar-url";

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
