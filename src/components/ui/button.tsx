import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.985]",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-contrast shadow-[inset_0_1px_0_0_rgb(255_255_255/0.22),0_1px_2px_0_rgb(0_0_0/0.5)] hover:bg-accent-hover",
        inverse: "bg-fg text-bg shadow-[0_1px_2px_0_rgb(0_0_0/0.5)] hover:bg-white",
        secondary:
          "border border-line-strong bg-surface-2 text-fg edge-highlight hover:border-white/20 hover:bg-surface-3",
        outline: "border border-line-strong text-fg hover:border-white/25 hover:bg-white/[0.04]",
        ghost: "text-fg-muted hover:bg-white/[0.06] hover:text-fg",
        danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
        link: "rounded-sm text-accent-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8",
        inline: "h-auto p-0 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (for example a link) with button styling. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: props.type ?? "button" })}
      {...props}
    />
  );
}
