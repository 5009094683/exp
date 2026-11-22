import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container, Eyebrow } from "./layout";

/** Shared hero for inner pages: grid backdrop, eyebrow, headline, lede and actions. */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-b-from-20% mask-b-to-90% opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
      />
      <Container className="relative py-20 md:py-28">
        <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
          {eyebrow ? <Eyebrow className="mb-5 animate-fade-up">{eyebrow}</Eyebrow> : null}
          <h1 className="animate-fade-up text-gradient text-4xl leading-[1.06] font-semibold tracking-[-0.03em] anim-delay-75 md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-fg-muted anim-delay-150 md:text-xl">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div
              className={cn(
                "mt-9 flex animate-fade-up flex-wrap items-center gap-3 anim-delay-200",
                align === "center" && "justify-center",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
