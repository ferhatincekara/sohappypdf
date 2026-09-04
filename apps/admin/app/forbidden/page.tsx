import { AuthShell } from "@/features/auth/auth-shell";
import { SignOutButton } from "@/features/auth/sign-out-button";

export default function ForbiddenPage() {
  return (
    <AuthShell
      eyebrow="Access restricted"
      title="You don’t have admin access"
      description="This console is limited to SoHappyPDF administrators. Your current account can use the public product, but it cannot open operations data."
    >
      <SignOutButton label="Sign out" className="w-full" />
    </AuthShell>
  );
}
