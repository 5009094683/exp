import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const controlClasses = cn(
  "w-full rounded-lg border border-line-strong bg-white/[0.03] px-3 text-sm text-fg",
  "placeholder:text-fg-faint",
  "transition-[border-color,background-color,box-shadow] duration-150",
  "hover:border-white/20",
  "focus:border-accent-text/70 focus:bg-white/[0.05] focus:ring-3 focus:ring-accent/20 focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger/60 aria-invalid:ring-danger/15",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClasses, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

/** Native select with custom chrome: accessible and mobile friendly by default. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        className={cn(controlClasses, "h-10 appearance-none pr-9 [&>option]:bg-surface", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
    </span>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("block text-[13px] font-medium text-fg-muted", className)} {...props} />
  );
}

/** Label, control, optional hint and error message, wired together for assistive tech. */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional ? <span className="text-xs text-fg-faint">Optional</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
