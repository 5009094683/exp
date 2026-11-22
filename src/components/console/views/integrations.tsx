"use client";

import { Plug, Plus, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { TimeAgo } from "@/components/console/clock";
import {
  KeyValue,
  Mono,
  Monogram,
  PageHeader,
  Panel,
  SearchInput,
  Stat,
  Table,
  Td,
  Th,
  rowLink,
} from "@/components/console/ui";
import { GateButton, useGate } from "@/components/leads/early-access-button";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents } from "@/demo/agents";
import { formatCompact, formatDuration, formatNumber, formatPercent } from "@/demo/format";
import { catalog, servers, type McpServer, type ToolPermission } from "@/demo/integrations";
import { cn } from "@/lib/cn";

const PERMISSIONS: Array<{ value: ToolPermission; label: string }> = [
  { value: "allow", label: "Allow" },
  { value: "approval", label: "Require approval" },
  { value: "deny", label: "Block" },
];

function agentsUsing(serverId: string): string[] {
  return agents
    .filter((agent) => agent.tools.some((tool) => tool.startsWith(`${serverId}.`)))
    .map((agent) => agent.name);
}

function ServerSheet({ server }: { server: McpServer }) {
  const gate = useGate();
  const usedBy = agentsUsing(server.id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3 pr-8">
        <Monogram name={server.name} className="size-10 text-xs" />
        <div className="min-w-0">
          <DialogTitle>{server.name}</DialogTitle>
          <DialogDescription className="mt-0.5">{server.description}</DialogDescription>
        </div>
      </div>

      {server.status === "degraded" ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-[13px] text-fg">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="leading-relaxed">
            {formatPercent(server.errorRate)} of calls failed in the last 24 hours and latency is
            well above normal. Agents retry automatically; runs that exhaust their retries fail.
          </p>
        </div>
      ) : null}

      <KeyValue
        items={[
          {
            label: "Status",
            value: (
              <Badge tone={server.status === "connected" ? "success" : "warning"} size="sm">
                {server.status === "connected" ? "Connected" : "Degraded"}
              </Badge>
            ),
          },
          { label: "Transport", value: server.transport },
          { label: "Endpoint", value: <Mono className="break-all">{server.url}</Mono> },
          { label: "Authentication", value: server.auth },
          { label: "Calls run as", value: server.identity },
          { label: "Calls · 24h", value: formatNumber(server.calls24h) },
          { label: "Latency (p50)", value: formatDuration(server.p50Ms) },
          { label: "Error rate", value: formatPercent(server.errorRate) },
          {
            label: "Used by",
            value: usedBy.length > 0 ? usedBy.join(", ") : "No agents yet",
          },
        ]}
      />

      <div>
        <h3 className="text-sm font-medium text-fg">Tools</h3>
        <p className="mt-1 text-xs text-fg-subtle">
          The most an agent can do with each tool. Agents can be narrowed further.
        </p>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {server.tools.map((tool) => (
            <li key={tool.name} className="flex items-center justify-between gap-4 px-3 py-2.5">
              <div className="min-w-0">
                <Mono className="text-fg">{tool.name}</Mono>
                <p className="mt-0.5 truncate text-xs text-fg-subtle">{tool.description}</p>
              </div>
              <label className="shrink-0">
                <span className="sr-only">Permission for {tool.name}</span>
                <select
                  value={tool.permission}
                  // Changing a permission is a real change, so it opens the access request.
                  onChange={() => gate("generic", "console:tool-permission")}
                  className={cn(
                    "h-7 rounded-md border bg-white/[0.03] px-2 text-xs focus:outline-none [&>option]:bg-surface [&>option]:text-fg",
                    tool.permission === "allow" && "border-success/30 text-success",
                    tool.permission === "approval" && "border-warning/30 text-warning",
                    tool.permission === "deny" && "border-danger/30 text-danger",
                  )}
                >
                  {PERMISSIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <GateButton gate="generic" source="console:disconnect-server" variant="danger" size="sm">
        Disconnect server
      </GateButton>
    </div>
  );
}

function CustomServerForm() {
  const id = useId();
  const gate = useGate();

  return (
    <form
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        gate("connect-mcp");
      }}
    >
      <Field id={`${id}-name`} label="Name">
        <Input id={`${id}-name`} placeholder="Inventory service" />
      </Field>
      <Field id={`${id}-transport`} label="Transport">
        <Select id={`${id}-transport`} defaultValue="http">
          <option value="http">Streamable HTTP</option>
          <option value="connector">Private connector</option>
        </Select>
      </Field>
      <Field id={`${id}-url`} label="Server URL" className="sm:col-span-2">
        <Input id={`${id}-url`} type="url" placeholder="https://mcp.internal.example/inventory" />
      </Field>
      <Field id={`${id}-auth`} label="Authentication">
        <Select id={`${id}-auth`} defaultValue="oauth">
          <option value="oauth">OAuth 2.1</option>
          <option value="key">API key</option>
          <option value="service">Service account</option>
          <option value="mtls">Mutual TLS</option>
        </Select>
      </Field>
      <Field id={`${id}-identity`} label="Calls run as">
        <Select id={`${id}-identity`} defaultValue="service">
          <option value="service">A service identity</option>
          <option value="user">Each user (delegated)</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          <Plug aria-hidden="true" />
          Connect server
        </Button>
      </div>
    </form>
  );
}

export function IntegrationsView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<McpServer | null>(null);

  const visible = servers.filter((server) =>
    `${server.name} ${server.category} ${server.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const totalCalls = servers.reduce((sum, server) => sum + server.calls24h, 0);
  const totalTools = servers.reduce((sum, server) => sum + server.tools.length, 0);
  const gatedTools = servers.reduce(
    (sum, server) => sum + server.tools.filter((tool) => tool.permission !== "allow").length,
    0,
  );

  return (
    <>
      <PageHeader
        title="Integrations"
        description="MCP servers connected to this workspace, and what each of their tools is allowed to do."
        actions={
          <GateButton gate="connect-mcp" size="sm">
            <Plus aria-hidden="true" />
            Connect server
          </GateButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Connected servers"
          value={servers.length}
          hint={`${catalog.length} more in the catalog`}
        />
        <Stat label="Tools exposed" value={totalTools} hint={`${gatedTools} gated or blocked`} />
        <Stat label="Tool calls · 24h" value={formatCompact(totalCalls)} />
        <Stat
          label="Degraded"
          value={servers.filter((server) => server.status === "degraded").length}
          tone={servers.some((server) => server.status === "degraded") ? "warning" : "default"}
          hint="Servers with elevated errors"
        />
      </div>

      <Tabs defaultValue="connected">
        <TabsList>
          <TabsTrigger value="connected">
            Connected
            <span className="text-fg-faint">{servers.length}</span>
          </TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="custom">Custom server</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="mt-6 space-y-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search servers"
            className="sm:w-72"
          />
          <Panel>
            <Table>
              <thead>
                <tr>
                  <Th>Server</Th>
                  <Th>Status</Th>
                  <Th className="hidden lg:table-cell">Transport</Th>
                  <Th className="hidden md:table-cell">Tools</Th>
                  <Th className="hidden text-right sm:table-cell">Calls · 24h</Th>
                  <Th className="hidden text-right xl:table-cell">p50</Th>
                  <Th className="hidden text-right xl:table-cell">Errors</Th>
                  <Th className="hidden text-right md:table-cell">Last call</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((server) => {
                  const gated = server.tools.filter(
                    (tool) => tool.permission === "approval",
                  ).length;
                  const blocked = server.tools.filter((tool) => tool.permission === "deny").length;
                  return (
                    <tr key={server.id} className={rowLink} onClick={() => setSelected(server)}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Monogram name={server.name} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelected(server)}
                              className="font-medium text-fg hover:underline"
                            >
                              {server.name}
                            </button>
                            <p className="truncate text-xs text-fg-subtle">{server.category}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <StatusDot tone={server.status === "connected" ? "success" : "warning"} />
                          {server.status === "connected" ? "Connected" : "Degraded"}
                        </span>
                      </Td>
                      <Td className="hidden whitespace-nowrap lg:table-cell">{server.transport}</Td>
                      <Td className="hidden whitespace-nowrap md:table-cell">
                        {server.tools.length}
                        {gated + blocked > 0 ? (
                          <span className="text-fg-subtle">
                            {" "}
                            · {gated > 0 ? `${gated} gated` : ""}
                            {gated > 0 && blocked > 0 ? ", " : ""}
                            {blocked > 0 ? `${blocked} blocked` : ""}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="hidden text-right tabular-nums sm:table-cell">
                        {formatNumber(server.calls24h)}
                      </Td>
                      <Td className="hidden text-right font-mono text-xs tabular-nums xl:table-cell">
                        {formatDuration(server.p50Ms)}
                      </Td>
                      <Td className="hidden text-right tabular-nums xl:table-cell">
                        <span className={server.errorRate > 0.02 ? "text-warning" : undefined}>
                          {formatPercent(server.errorRate)}
                        </span>
                      </Td>
                      <Td className="hidden text-right whitespace-nowrap md:table-cell">
                        <TimeAgo minutes={server.lastCallMinutesAgo} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="catalog" className="mt-6">
          <p className="mb-4 text-sm text-fg-muted">
            Servers that can be connected with a few clicks. Any other MCP server can be added as a
            custom server.
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 edge-highlight"
              >
                <Monogram name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{item.name}</p>
                  <p className="truncate text-xs text-fg-subtle">
                    {item.category} · {item.description}
                  </p>
                </div>
                <GateButton gate="connect-mcp" variant="secondary" size="sm">
                  Connect
                </GateButton>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Panel
            title="Add a custom MCP server"
            description="Any server that speaks the Model Context Protocol, hosted by you or a vendor."
            bodyClassName="p-5"
            className="max-w-2xl"
          >
            <CustomServerForm />
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
      >
        <SheetContent className="max-w-lg">
          {selected ? <ServerSheet server={selected} /> : null}
        </SheetContent>
      </Dialog>
    </>
  );
}
