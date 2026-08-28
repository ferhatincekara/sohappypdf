import { Input as InputPrimitive } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "box-border h-12 min-h-12 max-h-12 w-full min-w-0 rounded-2xl border border-input bg-white px-4 py-1 text-base leading-none shadow-none outline-none transition-[border-color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_1px_var(--color-primary)] focus:placeholder:opacity-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:shadow-[0_0_0_1px_var(--color-destructive)] md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
