import { ArrowDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { capabilities, type CapabilitySlug } from "@/content/capabilities";
import { cn } from "@/lib/cn";

function Layer({
  label,
  accent = false,
  children,
  className,
}: {
  label: string;
  accent?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-4 edge-highlight sm:p-5",
        accent ? "border-accent/40 bg-accent/[0.06]" : "border-line",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-[11px] tracking-[0.16em] uppercase",
          accent ? "text-accent-text" : "text-fg-subtle",
        )}
      >
        {label}
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-[13px] text-fg-muted">
      {children}
    </li>
  );
}

function CapabilityBox({ slug, note }: { slug: CapabilitySlug; note: string }) {
  const capability = capabilities.find((item) => item.slug === slug);
  if (!capability) return null;
  const Icon: LucideIcon = capability.icon;

  return (
    <Link
      href={`/platform/${slug}`}
      className="group flex h-full items-start gap-3 rounded-xl border border-line bg-bg/60 p-3.5 transition-colors hover:border-accent/50"
    >
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-accent-text">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{capability.name}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-fg-subtle">{note}</span>
      </span>
    </Link>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-2 text-fg-faint" aria-hidden="true">
      <ArrowDown className="size-4" />
    </div>
  );
}

/** How a request flows through the platform, from trigger to audit record. */
export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Layer label="Triggers">
        <ul className="flex flex-wrap gap-2">
          {["Webhooks", "Schedules", "Event streams", "API calls", "Other agents"].map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
        </ul>
      </Layer>

      <Connector />

      <Layer label="Control plane" accent>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <CapabilityBox slug="orchestration" note="Durable runs, retries and approvals" />
          <CapabilityBox slug="permissions" note="A policy decision on every action" />
          <CapabilityBox slug="memory" note="Scoped context with retention" />
          <CapabilityBox slug="integrations" note="Tools and credentials over MCP" />
        </div>
      </Layer>

      <Connector />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Layer label="Execution">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-bg/60 p-3.5">
              <p className="text-sm font-medium text-fg">Model gateway</p>
              <p className="mt-0.5 text-[13px] leading-snug text-fg-subtle">
                Your providers, routed by profile
              </p>
            </div>
            <CapabilityBox slug="sandboxes" note="Isolated, limited code execution" />
          </div>
        </Layer>
        <Layer label="Your systems">
          <ul className="flex flex-wrap gap-2">
            {["SaaS tools", "Internal APIs", "Databases", "Private MCP servers"].map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </ul>
          <p className="mt-3 text-[13px] leading-snug text-fg-subtle">
            Reached through MCP servers, or a connector that runs inside your network.
          </p>
        </Layer>
      </div>

      <Connector />

      <Layer label="Record">
        <CapabilityBox
          slug="audit-logs"
          note="Every decision, call and approval, attributed and hash-chained"
        />
      </Layer>
    </div>
  );
}
