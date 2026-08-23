import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthFormError({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
