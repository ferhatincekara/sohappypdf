import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { SlideLabel } from "@/components/ui/slide-label";
import { cn } from "@/lib/utils";

const iconButtonSizes = new Set(["icon", "icon-xs", "icon-sm", "icon-lg"]);

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-semibold tracking-tight whitespace-nowrap no-underline transition-[color,background-color,filter,box-shadow,opacity] duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive hover:no-underline [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline:
          "border-transparent bg-muted text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "font-medium aria-expanded:text-foreground",
        destructive: "bg-destructive/10 text-destructive",
        white: "bg-white text-foreground",
        dark: "bg-foreground text-background",
      },
      size: {
        default:
          "h-11 gap-1.5 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        lg: "h-14 gap-2 px-8 text-[17px] has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  slideLabel,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    slideLabel?: boolean;
  }) {
  const useSlideLabel =
    slideLabel !== false && size !== null && !iconButtonSizes.has(size);

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {useSlideLabel ? <SlideLabel>{children}</SlideLabel> : children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
