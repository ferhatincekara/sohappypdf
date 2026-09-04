import { resolveAvatarUrl } from "@/features/identity/gravatar-url";
import { UserAvatar } from "@/features/identity/user-avatar";

export function UserCell({
  email,
  name,
  image,
}: {
  email: string | null;
  name?: string | null;
  image?: string | null;
}) {
  if (email === null || email.length === 0) {
    return <span className="text-muted-foreground">Unknown user</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <UserAvatar src={resolveAvatarUrl(email, image)} label={name ?? email} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{email}</span>
        {name !== undefined && name !== null && name.length > 0 ? (
          <span className="truncate text-xs text-muted-foreground">{name}</span>
        ) : null}
      </span>
    </span>
  );
}
