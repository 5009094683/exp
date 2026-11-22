import { cn } from "@/lib/cn";

/**
 * Abstract mark: a core layered over the system beneath it. It carries no
 * letterform, so it still fits when the product is renamed.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)}>
      <rect
        x="1.5"
        y="1.5"
        width="14.5"
        height="14.5"
        rx="4.25"
        fill="var(--accent)"
        opacity="0.4"
      />
      <rect x="8" y="8" width="14.5" height="14.5" rx="4.25" fill="var(--accent)" />
      <circle cx="15.25" cy="15.25" r="2.4" fill="var(--accent-contrast)" />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-fg">{name}</span>
    </span>
  );
}
