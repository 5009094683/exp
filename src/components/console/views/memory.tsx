"use client";

import { Database, EyeOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TimeAgo } from "@/components/console/clock";
import {
  EmptyState,
  FilterTabs,
  KeyValue,
  Mono,
  PageHeader,
  Panel,
  SearchInput,
  Stat,
} from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { formatCompact, formatNumber } from "@/demo/format";
import { memoryEntries, memoryScopes, type MemoryEntry } from "@/demo/memory";
import { cn } from "@/lib/cn";
import { useReturnFocus } from "@/lib/use-return-focus";

export function MemoryView() {
  const [scope, setScope] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemoryEntry | null>(null);
  const { remember, restore } = useReturnFocus();
  const openDetail = (item: MemoryEntry) => {
    remember();
    setSelected(item);
  };

  const totals = memoryScopes.reduce(
    (sum, item) => ({
      entries: sum.entries + item.entries,
      size: sum.size + item.sizeMb,
      reads: sum.reads + item.reads24h,
      writes: sum.writes + item.writes24h,
    }),
    { entries: 0, size: 0, reads: 0, writes: 0 },
  );

  const visible = memoryEntries.filter((entry) => {
    const text = `${entry.key} ${entry.content} ${entry.store} ${entry.writtenBy}`.toLowerCase();
    return (scope === "all" || entry.scope === scope) && text.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Memory"
        description="What agents remember between runs, organized into scopes with their own retention and redaction rules."
        actions={
          <GateButton
            gate="generic"
            source="console:new-memory-scope"
            variant="secondary"
            size="sm"
          >
            New scope
          </GateButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Entries" value={formatNumber(totals.entries)} hint="Across all scopes" />
        <Stat
          label="Stored"
          value={`${totals.size.toFixed(1)} MB`}
          hint="Encrypted at rest"
          icon={Database}
        />
        <Stat label="Reads · 24h" value={formatCompact(totals.reads)} />
        <Stat label="Writes · 24h" value={formatCompact(totals.writes)} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {memoryScopes.map((item) => {
          const active = scope === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setScope(active ? "all" : item.id)}
              className={cn(
                "rounded-xl border bg-surface p-4 text-left edge-highlight transition-colors",
                active ? "border-accent/60" : "border-line hover:border-line-strong",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <Mono className="text-success">{item.name}</Mono>
                <Badge size="sm">{item.kind}</Badge>
              </span>
              <span className="mt-2 block min-h-10 text-[13px] leading-relaxed text-fg-muted">
                {item.description}
              </span>
              <span className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-fg-subtle">
                <span>{formatNumber(item.entries)} entries</span>
                <span>{item.retention}</span>
              </span>
              {item.redaction.length > 0 ? (
                <span className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-subtle">
                  <EyeOff className="size-3" aria-hidden="true" />
                  Redacts {item.redaction.join(", ").replace(/_/g, " ")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search entries"
          className="lg:w-72"
        />
        <FilterTabs
          label="Filter by scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "All scopes" },
            ...memoryScopes.map((item) => ({ value: item.id, label: item.kind })),
          ]}
        />
        <p className="text-xs text-fg-subtle lg:ml-auto">A sample of recent entries</p>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No entries match"
            description="Try a different search or choose another scope."
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => openDetail(entry)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-start sm:gap-6"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Mono className="text-fg">{entry.key}</Mono>
                      <Badge size="sm">{entry.kind}</Badge>
                      {entry.redactedFields > 0 ? (
                        <Badge tone="warning" size="sm">
                          <EyeOff aria-hidden="true" />
                          {entry.redactedFields} redacted
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-fg-muted">
                      {entry.content}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4 text-xs text-fg-subtle sm:flex-col sm:items-end sm:gap-1">
                    <Mono className="text-success">{entry.store}</Mono>
                    <TimeAgo minutes={entry.createdMinutesAgo} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
      >
        <SheetContent className="max-w-lg" onCloseAutoFocus={restore}>
          {selected ? (
            <div className="space-y-5 p-6">
              <div className="pr-8">
                <DialogTitle className="font-mono text-base">{selected.key}</DialogTitle>
                <DialogDescription className="mt-1">
                  {selected.kind} in{" "}
                  <span className="font-mono text-success">{selected.store}</span>
                </DialogDescription>
              </div>
              <p className="rounded-lg border border-line bg-black/20 p-3.5 text-sm leading-relaxed text-fg">
                {selected.content}
              </p>
              <KeyValue
                items={[
                  { label: "Entry ID", value: <Mono>{selected.id}</Mono> },
                  { label: "Written by", value: selected.writtenBy },
                  {
                    label: "Source run",
                    value: selected.sourceRunId ? (
                      <Link
                        href={`/console/runs/${selected.sourceRunId}`}
                        className="hover:underline"
                      >
                        <Mono>{selected.sourceRunId}</Mono>
                      </Link>
                    ) : (
                      "Written from the console"
                    ),
                  },
                  { label: "Created", value: <TimeAgo minutes={selected.createdMinutesAgo} /> },
                  {
                    label: "Expires",
                    value:
                      selected.expiresInDays === null
                        ? "Never"
                        : selected.expiresInDays === 0
                          ? "When the run ends"
                          : `In ${selected.expiresInDays} days`,
                  },
                  { label: "Reads · 7 days", value: formatNumber(selected.reads7d) },
                  {
                    label: "Redaction",
                    value:
                      selected.redactedFields > 0
                        ? `${selected.redactedFields} field removed before write`
                        : "Nothing redacted",
                  },
                ]}
              />
              <GateButton gate="generic" source="console:delete-memory" variant="danger" size="sm">
                <Trash2 aria-hidden="true" />
                Delete entry
              </GateButton>
            </div>
          ) : null}
        </SheetContent>
      </Dialog>
    </>
  );
}
