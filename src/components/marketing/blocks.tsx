import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AppRoute } from "@/lib/routes";
import { Container, Eyebrow } from "./layout";

/** Hero with copy on the left and a product visual on the right. */
export function SplitHero({
  eyebrow,
  title,
  description,
  actions,
  visual,
  footer,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  visual: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-b-from-20% mask-b-to-90% opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 left-1/3 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]"
      />
      <Container className="relative py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="min-w-0">
            <Eyebrow className="animate-fade-up">{eyebrow}</Eyebrow>
            <h1 className="mt-5 animate-fade-up text-gradient text-4xl leading-[1.06] font-semibold tracking-[-0.03em] anim-delay-75 md:text-[3.4rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-fg-muted anim-delay-150">
              {description}
            </p>
            {actions ? (
              <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 anim-delay-200">
                {actions}
              </div>
            ) : null}
          </div>
          <div className="relative min-w-0 animate-fade-up anim-delay-300">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl"
            />
            <div className="relative">{visual}</div>
          </div>
        </div>
        {footer}
      </Container>
    </section>
  );
}

/** Short claims in a row, used directly under a hero. */
export function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3 bg-bg/80 px-5 py-4 text-[15px] text-fg">
          <Check className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export type Feature = { icon: LucideIcon; title: string; body: string };

/** Bordered grid of features: icon, title and a sentence or two. */
export function FeatureGrid({
  features,
  columns = 3,
  className,
}: {
  features: Feature[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {features.map((feature) => (
        <li key={feature.title} className="reveal bg-surface p-7">
          <feature.icon className="size-5 text-accent-text" aria-hidden="true" />
          <h3 className="mt-4 font-medium text-fg">{feature.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{feature.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function Checklist({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-fg-muted">
          <Check className="mt-1 size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Card that links somewhere, with an icon, a title and one line of context. */
export function LinkCard({
  href,
  icon: Icon,
  title,
  body,
  label = "Learn more",
}: {
  href: AppRoute;
  icon: LucideIcon;
  title: string;
  body: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 edge-highlight transition-colors hover:border-line-strong"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-accent-text">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-medium text-fg">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-fg-muted">{body}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-fg">
        {label}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
