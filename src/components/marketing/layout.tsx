import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-[1200px]",
        size === "wide" && "max-w-[1360px]",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  tone = "default",
  divider = false,
  ...props
}: ComponentProps<"section"> & { tone?: "default" | "subtle"; divider?: boolean }) {
  return (
    <section
      className={cn(
        "relative py-20 md:py-28",
        tone === "subtle" && "bg-bg-subtle",
        divider && "border-t border-line",
        className,
      )}
      {...props}
    />
  );
}

/** Small monospace label that introduces a section. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-mono text-xs font-medium tracking-[0.16em] text-accent-text uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
      <Heading className="text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-fg md:text-[2.75rem]">
        {title}
      </Heading>
      {description ? (
        <p className="mt-5 text-lg leading-relaxed text-fg-muted">{description}</p>
      ) : null}
    </div>
  );
}
