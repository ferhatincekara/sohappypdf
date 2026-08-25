import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminApiError } from "@/lib/admin-api";
import { getAdminActor } from "@/lib/get-admin-actor";

export default async function AdminLoginPage() {
  try {
    const actor = await getAdminActor();

    if (actor !== null) {
      redirect("/");
    }
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      redirect("/forbidden");
    }

    throw error;
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use an allowlisted operator account. This console is not a customer
          product.
        </p>
      </div>
      <AdminLoginForm />
    </main>
  );
}
