"use client";

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Cog,
  Download,
  Link2,
  ScrollText,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Timestamp } from "@/components/console/clock";
import {
  EmptyState,
  FilterTabs,
  JsonView,
  KeyValue,
  Mono,
  PageHeader,
  Panel,
  SearchInput,
  SelectFilter,
  Table,
  Td,
  Th,
  rowLink,
} from "@/components/console/ui";
import { useGate } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AUDIT_CATEGORIES,
  auditEvents,
  shortHash,
  type AuditCategory,
  type AuditEvent,
  type AuditOutcome,
} from "@/demo/audit";
import { formatNumber } from "@/demo/format";

const PAGE_SIZE = 20;

type ActorFilter = "all" | AuditEvent["actor"]["type"];

const OUTCOMES: Record<
  AuditOutcome,
  { label: string; tone: "success" | "danger" | "warning" | "neutral" }
> = {
  success: { label: "Success", tone: "success" },
  denied: { label: "Denied", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
  pending: { label: "Pending", tone: "warning" },
};

const ACTOR_ICONS = { agent: Bot, user: User, system: Cog };

function EventSheet({ event }: { event: AuditEvent }) {
  const ActorIcon = ACTOR_ICONS[event.actor.type];
  return (
    <div className="space-y-5 p-6">
      <div className="pr-8">
        <DialogTitle className="font-mono text-base">{event.action}</DialogTitle>
        <DialogDescription className="mt-1">
          <Timestamp minutes={event.minutesAgo} />
        </DialogDescription>
      </div>

      <KeyValue
        items={[
          { label: "Event ID", value: <Mono>{event.id}</Mono> },
          {
            label: "Actor",
            value: (
              <span className="inline-flex items-center gap-1.5">
                <ActorIcon className="size-3.5 text-fg-subtle" aria-hidden="true" />
                <Mono>
                  {event.actor.type}:{event.actor.id}
                </Mono>
              </span>
            ),
          },
          { label: "Resource", value: <Mono className="break-all">{event.resource}</Mono> },
          {
            label: "Outcome",
            value: (
              <Badge tone={OUTCOMES[event.outcome].tone} size="sm">
                {OUTCOMES[event.outcome].label}
              </Badge>
            ),
          },
          ...(event.ip ? [{ label: "Source address", value: <Mono>{event.ip}</Mono> }] : []),
          ...(event.runId
            ? [
                {
                  label: "Run",
                  value: (
                    <Link href={`/console/runs/${event.runId}`} className="hover:underline">
                      <Mono>{event.runId}</Mono>
                    </Link>
                  ),
                },
              ]
            : []),
        ]}
      />

      {event.detail ? <JsonView value={event.detail} label="Detail" /> : null}

      <div className="rounded-lg border border-line bg-white/[0.02] p-3.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-fg">
          <Link2 className="size-3.5 text-success" aria-hidden="true" />
          Hash chain
        </p>
        <dl className="mt-3 space-y-2.5 font-mono text-[11px]">
          <div>
            <dt className="text-fg-subtle">previous event</dt>
            <dd className="mt-0.5 break-all text-fg-muted">{event.prevHash}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">this event</dt>
            <dd className="mt-0.5 break-all text-fg">{event.hash}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
          Each event includes the hash of the one before it, so a missing or altered event breaks
          the chain.
        </p>
      </div>
    </div>
  );
}

export function AuditView() {
  const gate = useGate();
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState<ActorFilter>("all");
  const [category, setCategory] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const filtered = auditEvents.filter((event) => {
    const text =
      `${event.action} ${event.actor.id} ${event.resource} ${event.runId ?? ""} ${event.id}`.toLowerCase();
    return (
      (actor === "all" || event.actor.type === actor) &&
      (category === "all" || event.category === category) &&
      (outcome === "all" || event.outcome === outcome) &&
      text.includes(query.trim().toLowerCase())
    );
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  // Any filter change returns to the first page.
  const filterBy =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every model call, tool call, policy decision, approval and configuration change, in the order it happened."
        badge={
          <Badge tone="success">
            <Link2 aria-hidden="true" />
            Chain verified
          </Badge>
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Download aria-hidden="true" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export {formatNumber(filtered.length)} events</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => gate("export-audit", "console:export-audit-csv")}>
                Download as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => gate("export-audit", "console:export-audit-json")}>
                Download as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => gate("export-audit", "console:export-audit-stream")}
              >
                Stream to a SIEM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <SearchInput
          value={query}
          onChange={filterBy(setQuery)}
          placeholder="Search action, actor, resource or run"
          className="xl:w-80"
        />
        <FilterTabs
          label="Filter by actor"
          value={actor}
          onChange={filterBy(setActor)}
          options={[
            { value: "all", label: "All actors" },
            { value: "agent", label: "Agents" },
            { value: "user", label: "People" },
            { value: "system", label: "System" },
          ]}
        />
        <div className="flex gap-3 xl:ml-auto">
          <SelectFilter
            label="Filter by category"
            value={category}
            onChange={filterBy(setCategory)}
            options={[
              { value: "all", label: "All categories" },
              ...(Object.keys(AUDIT_CATEGORIES) as AuditCategory[]).map((key) => ({
                value: key,
                label: AUDIT_CATEGORIES[key],
              })),
            ]}
          />
          <SelectFilter
            label="Filter by outcome"
            value={outcome}
            onChange={filterBy(setOutcome)}
            options={[
              { value: "all", label: "All outcomes" },
              ...(Object.keys(OUTCOMES) as AuditOutcome[]).map((key) => ({
                value: key,
                label: OUTCOMES[key].label,
              })),
            ]}
          />
        </div>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No events match"
            description="Try a different search, or clear the actor, category and outcome filters."
          />
        ) : (
          <Table className="font-mono text-[12px]">
            <thead>
              <tr>
                <Th className="sm:hidden">Event</Th>
                <Th className="hidden sm:table-cell">Time (UTC)</Th>
                <Th className="hidden sm:table-cell">Actor</Th>
                <Th className="hidden sm:table-cell">Action</Th>
                <Th className="hidden md:table-cell">Resource</Th>
                <Th>Outcome</Th>
                <Th className="hidden xl:table-cell">Hash</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((event) => {
                const ActorIcon = ACTOR_ICONS[event.actor.type];
                return (
                  <tr key={event.id} className={rowLink} onClick={() => setSelected(event)}>
                    <Td className="max-w-0 sm:hidden">
                      <button
                        type="button"
                        onClick={() => setSelected(event)}
                        className="block max-w-full truncate text-left text-fg"
                      >
                        {event.action}
                      </button>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-fg-subtle">
                        <ActorIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{event.actor.id}</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-fg-faint">
                        <Timestamp minutes={event.minutesAgo} />
                      </span>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-fg-subtle sm:table-cell">
                      <Timestamp minutes={event.minutesAgo} />
                    </Td>
                    <Td className="hidden whitespace-nowrap sm:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <ActorIcon className="size-3.5 text-fg-subtle" aria-hidden="true" />
                        {event.actor.id}
                      </span>
                    </Td>
                    <Td className="hidden whitespace-nowrap sm:table-cell">
                      <button
                        type="button"
                        onClick={() => setSelected(event)}
                        className="text-fg hover:underline"
                      >
                        {event.action}
                      </button>
                    </Td>
                    <Td className="hidden max-w-64 truncate md:table-cell">{event.resource}</Td>
                    <Td className="w-px text-right font-sans whitespace-nowrap sm:w-auto sm:text-left">
                      <Badge tone={OUTCOMES[event.outcome].tone} size="sm">
                        {OUTCOMES[event.outcome].label}
                      </Badge>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-fg-subtle xl:table-cell">
                      {shortHash(event.hash)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-xs text-fg-subtle">
          <p aria-live="polite">
            {filtered.length === 0
              ? "0 events"
              : `${current * PAGE_SIZE + 1}–${Math.min((current + 1) * PAGE_SIZE, filtered.length)} of ${formatNumber(filtered.length)} sample events`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="px-1 tabular-nums">
              {current + 1} / {pages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Panel>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
      >
        <SheetContent className="max-w-lg">
          {selected ? <EventSheet event={selected} /> : null}
        </SheetContent>
      </Dialog>
    </>
  );
}
