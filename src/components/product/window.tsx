import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Application frame used around product visuals on the marketing pages. */
export function ProductWindow({
  title,
  children,
  className,
  bodyClassName,
}: {
  /** Shown in the title bar, usually a path within the console. */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] edge-highlight",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-3 border-b border-line bg-white/[0.02] px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
        </span>
        {title ? (
          <span className="mx-auto flex h-6 max-w-[60%] items-center truncate rounded-md border border-line bg-black/20 px-3 font-mono text-[11px] text-fg-subtle">
            {title}
          </span>
        ) : null}
        <span className="w-[42px]" aria-hidden="true" />
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Plain panel with a small header, for visuals inside feature cards. */
export function VisualPanel({
  label,
  action,
  children,
  className,
}: {
  label: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface edge-highlight",
        className,
      )}
    >
      <div className="flex h-9 items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-3.5">
        <span className="truncate font-mono text-[11px] text-fg-subtle">{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
