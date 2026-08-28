import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthInlineNotice({ message }: { message: string }) {
  return (
    <Alert className="rounded-lg border-border bg-muted">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
