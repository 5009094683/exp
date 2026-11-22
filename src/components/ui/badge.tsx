import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-line-strong bg-white/[0.04] text-fg-muted",
        accent: "border-accent/30 bg-accent/10 text-accent-text",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        danger: "border-danger/25 bg-danger/10 text-danger",
        info: "border-info/25 bg-info/10 text-info",
      },
      size: {
        sm: "px-2 py-px text-[11px]",
        md: "",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/** Small status dot; pulses when `live`. */
export function StatusDot({
  tone = "success",
  live = false,
  className,
}: {
  tone?: "success" | "warning" | "danger" | "info" | "neutral" | "accent";
  live?: boolean;
  className?: string;
}) {
  const color = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-fg-subtle",
    accent: "bg-accent-text",
  }[tone];

  return (
    <span className={cn("relative inline-flex size-1.5 shrink-0", className)} aria-hidden="true">
      {live ? (
        <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />
      ) : null}
      <span className={cn("relative size-1.5 rounded-full", color)} />
    </span>
  );
}
