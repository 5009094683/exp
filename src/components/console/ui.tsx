import { Search, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Code } from "@/components/ui/code-block";
import { CopyButton } from "@/components/ui/copy-button";
import type { Json } from "@/demo/runs";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-line bg-surface edge-highlight",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-fg">{title}</h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-fg-subtle">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
  /** Optional chart shown under the value. */
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 edge-highlight">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] text-fg-muted">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" /> : null}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
          tone === "default" && "text-fg",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-xs text-fg-subtle">{hint}</p> : null}
      {children}
    </div>
  );
}

/* --- Tables ------------------------------------------------------------ */

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    // Positioned so visually hidden header labels are clipped with the table.
    <div className="relative overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[13px]", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-white/[0.02] px-4 py-2.5 text-xs font-medium whitespace-nowrap text-fg-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-line px-4 py-3 align-middle text-fg-muted", className)}
      {...props}
    />
  );
}

/** Row styling for tables whose rows open a detail view. */
export const rowLink =
  "cursor-pointer transition-colors hover:bg-white/[0.03] focus-within:bg-white/[0.03] [&:last-child>td]:border-b-0";

/* --- Inputs ------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-subtle"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line-strong bg-white/[0.03] pr-3 pl-9 text-[13px] text-fg transition-colors placeholder:text-fg-faint hover:border-white/20 focus:border-accent-text/70 focus:ring-3 focus:ring-accent/20 focus:outline-none"
      />
    </label>
  );
}

export { FilterTabs } from "./filter-tabs";

export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-lg border border-line-strong bg-white/[0.03] pr-8 pl-3 text-[13px] text-fg transition-colors hover:border-white/20 focus:border-accent-text/70 focus:outline-none [&>option]:bg-surface"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-1.5 -translate-y-[70%] rotate-45 border-r border-b border-fg-subtle"
      />
    </label>
  );
}

/* --- Details ----------------------------------------------------------- */

export function KeyValue({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-line text-[13px]", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-6 py-2.5">
          <dt className="shrink-0 text-fg-subtle">{item.label}</dt>
          <dd className="min-w-0 text-right break-words text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Mono({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("font-mono text-[12px]", className)} {...props} />;
}

/** Monospace identifier with a copy button. */
export function CopyId({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Mono className="text-fg-muted">{value}</Mono>
      <CopyButton value={value} label="Copy ID" className="size-6" />
    </span>
  );
}

export function JsonView({ value, label }: { value: Json; label: string }) {
  const code = JSON.stringify(value, null, 2);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-black/20">
      <div className="flex h-8 items-center justify-between border-b border-line px-3">
        <span className="font-mono text-[11px] text-fg-subtle">{label}</span>
        <CopyButton value={code} label={`Copy ${label}`} className="size-6" />
      </div>
      <Code code={code} language="json" className="p-3 text-[12px]" />
    </div>
  );
}

export function Terminal({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg border border-line bg-black/30 p-3 font-mono text-[12px] leading-[1.7] text-fg-muted",
        className,
      )}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          className={cn(
            "block",
            line.startsWith("$") && "text-fg",
            (line.includes("✗") || line.includes("×") || /^killed|failed/i.test(line.trim())) &&
              "text-danger",
            line.includes("✓") && "text-success",
          )}
        >
          {line}
        </span>
      ))}
    </pre>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-fg-subtle">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s.]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white/[0.05] font-mono text-[10px] font-medium text-fg-muted",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Two-letter tile used for integrations, which have no logos in the demo. */
export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.04] font-mono text-[11px] font-semibold text-fg-muted",
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
