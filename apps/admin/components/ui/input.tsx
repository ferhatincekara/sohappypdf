import { Input as InputPrimitive } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-card px-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring disabled:opacity-50 sm:h-8",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
