"use client";

import { ArrowLeft, ArrowRight, Check, Lock, Rocket } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { Mono, Monogram, PageHeader, Panel } from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/switch";
import { MODEL_PROFILES, type ModelProfile } from "@/demo/agents";
import { servers } from "@/demo/integrations";
import { buildManifest, type ManifestInput } from "@/demo/manifest";
import { policies } from "@/demo/policies";
import { sandboxTemplates } from "@/demo/sandboxes";
import { cn } from "@/lib/cn";

const STEPS = ["Basics", "Model", "Tools", "Guardrails", "Review"] as const;

const blank: ManifestInput = {
  name: "",
  description: "",
  model: "balanced",
  instructions: "",
  triggers: ["manual"],
  tools: [],
  policies: ["least-privilege"],
  memoryScopes: ["agent"],
  sandbox: undefined,
  concurrency: 10,
  maxDuration: "10m",
  dailyBudgetUsd: 100,
};

const templates: Array<{ id: string; title: string; body: string; values: ManifestInput }> = [
  {
    id: "support",
    title: "Support triage",
    body: "Classify tickets, search the help center and draft a reply.",
    values: {
      ...blank,
      name: "Support triage",
      description: "Classify inbound tickets and draft a first reply.",
      instructions:
        "Classify each new ticket, look up relevant help articles and the customer's history, then draft a reply in our support voice. Escalate urgent issues to a support lead before replying.",
      triggers: ["zendesk · ticket.created"],
      tools: ["zendesk.get_ticket", "zendesk.add_comment", "knowledge-base.search"],
      policies: ["least-privilege", "p1-replies"],
      memoryScopes: ["tenant", "agent"],
      concurrency: 50,
      dailyBudgetUsd: 600,
    },
  },
  {
    id: "data",
    title: "Data quality monitor",
    body: "Check tables on a schedule, run a script and open a ticket.",
    values: {
      ...blank,
      name: "Data quality monitor",
      description: "Check warehouse tables for freshness and anomalies.",
      model: "fast",
      instructions:
        "Every 30 minutes, check freshness and row-count drift for the monitored tables. Run the anomaly script in a sandbox and open a ticket with evidence when a check fails.",
      triggers: ["Every 30 min"],
      tools: ["snowflake.query", "jira.create_issue"],
      policies: ["least-privilege", "sandbox-egress"],
      sandbox: "python-data",
      concurrency: 8,
    },
  },
  {
    id: "blank",
    title: "Start from scratch",
    body: "An empty agent with the default-deny policy.",
    values: blank,
  },
];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function OptionCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-accent/60 bg-accent/[0.08]"
          : "border-line bg-white/[0.02] hover:border-line-strong",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg">{title}</span>
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full border",
            selected ? "border-accent bg-accent text-accent-contrast" : "border-line-strong",
          )}
        >
          {selected ? <Check className="size-2.5" strokeWidth={3} aria-hidden="true" /> : null}
        </span>
      </span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-fg-muted">{body}</span>
    </button>
  );
}

export function AgentWizard() {
  const id = useId();
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState("support");
  const [values, setValues] = useState<ManifestInput>(templates[0].values);
  const [nameError, setNameError] = useState<string>();
  const top = useRef<HTMLDivElement>(null);

  const manifest = useMemo(() => buildManifest(values), [values]);
  const set = <K extends keyof ManifestInput>(key: K, value: ManifestInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  function next() {
    if (step === 0 && values.name.trim() === "") {
      setNameError("Give the agent a name.");
      return;
    }
    setNameError(undefined);
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  function goTo(index: number) {
    setStep(index);
    // Steps differ in height, so bring the top of the new step back into view.
    requestAnimationFrame(() => {
      const element = top.current;
      if (element && element.getBoundingClientRect().top < 0) {
        element.scrollIntoView({ block: "start" });
      }
    });
  }

  return (
    <>
      <PageHeader
        title="New agent"
        description="Describe the agent, choose what it can use and set its limits. Nothing is deployed until the last step."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/console/agents">Cancel</Link>
          </Button>
        }
      />

      <div
        ref={top}
        className="grid scroll-mt-28 grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"
      >
        <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5" aria-label="Steps">
          {STEPS.map((label, index) => {
            const state = index === step ? "current" : index < step ? "done" : "todo";
            return (
              <li key={label} className="shrink-0">
                <button
                  type="button"
                  onClick={() => (index < step ? goTo(index) : undefined)}
                  disabled={index > step}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                    state === "current" && "bg-white/[0.07] font-medium text-fg",
                    state === "done" && "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                    state === "todo" && "cursor-default text-fg-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                      state === "current" && "border-accent/60 bg-accent/15 text-accent-text",
                      state === "done" && "border-success/40 bg-success/10 text-success",
                      state === "todo" && "border-line-strong",
                    )}
                  >
                    {state === "done" ? <Check className="size-3" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <Panel bodyClassName="p-5 sm:p-6">
          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-fg">Start from</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {templates.map((item) => (
                    <OptionCard
                      key={item.id}
                      title={item.title}
                      body={item.body}
                      selected={template === item.id}
                      onSelect={() => {
                        setTemplate(item.id);
                        setValues(item.values);
                        setNameError(undefined);
                      }}
                    />
                  ))}
                </div>
              </div>
              <Field id={`${id}-name`} label="Name" error={nameError}>
                <Input
                  id={`${id}-name`}
                  value={values.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Invoice reconciler"
                  aria-invalid={nameError ? true : undefined}
                />
              </Field>
              <Field
                id={`${id}-description`}
                label="Description"
                hint="One sentence. Shown in lists and in approval requests."
              >
                <Input
                  id={`${id}-description`}
                  value={values.description}
                  onChange={(event) => set("description", event.target.value)}
                  placeholder="Matches invoices to purchase orders."
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-fg">Model profile</p>
                <p className="mt-1 text-[13px] text-fg-muted">
                  Agents ask for a profile. Which model serves it is set in workspace settings.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(Object.keys(MODEL_PROFILES) as ModelProfile[]).map((profile) => (
                    <OptionCard
                      key={profile}
                      title={MODEL_PROFILES[profile].label}
                      body={MODEL_PROFILES[profile].description}
                      selected={values.model === profile}
                      onSelect={() => set("model", profile)}
                    />
                  ))}
                </div>
              </div>
              <Field
                id={`${id}-instructions`}
                label="Instructions"
                hint="What the agent should do, in plain language. Policies, not instructions, decide what it is allowed to do."
              >
                <Textarea
                  id={`${id}-instructions`}
                  rows={7}
                  value={values.instructions}
                  onChange={(event) => set("instructions", event.target.value)}
                  placeholder="Describe the job, the steps and when to hand off to a person."
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-fg">Tools</p>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    Grant only what the agent needs. Everything else stays denied.
                  </p>
                </div>
                <Badge tone="accent">{values.tools.length} selected</Badge>
              </div>
              {/* Positioned so visually hidden legends are clipped with the list. */}
              <div className="relative max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {servers.map((server) => (
                  <fieldset
                    key={server.id}
                    className="rounded-xl border border-line bg-white/[0.02]"
                  >
                    <legend className="sr-only">{server.name}</legend>
                    <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
                      <Monogram name={server.name} className="size-6 text-[10px]" />
                      <span className="text-[13px] font-medium text-fg">{server.name}</span>
                      <span className="ml-auto text-xs text-fg-subtle">{server.category}</span>
                    </div>
                    <ul className="grid grid-cols-1 gap-x-4 px-3.5 py-2 sm:grid-cols-2">
                      {server.tools.map((tool) => {
                        const reference = `${server.id}.${tool.name}`;
                        const checkboxId = `${id}-${reference}`;
                        const blocked = tool.permission === "deny";
                        return (
                          <li key={tool.name} className="flex items-center gap-2.5 py-1.5">
                            <Checkbox
                              id={checkboxId}
                              checked={values.tools.includes(reference)}
                              disabled={blocked}
                              onCheckedChange={() => set("tools", toggle(values.tools, reference))}
                            />
                            <label
                              htmlFor={checkboxId}
                              className={cn(
                                "flex min-w-0 items-center gap-2",
                                blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                              )}
                            >
                              <Mono className="truncate text-fg">{tool.name}</Mono>
                              {tool.permission === "approval" ? (
                                <Badge tone="warning" size="sm">
                                  approval
                                </Badge>
                              ) : null}
                              {blocked ? (
                                <Badge tone="danger" size="sm">
                                  blocked
                                </Badge>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-fg">Policies</p>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                  {policies.map((policy) => {
                    const locked = policy.id === "least-privilege";
                    const checkboxId = `${id}-policy-${policy.id}`;
                    return (
                      <li key={policy.id} className="flex items-start gap-3 px-3.5 py-3">
                        <Checkbox
                          id={checkboxId}
                          className="mt-0.5"
                          checked={values.policies.includes(policy.id)}
                          disabled={locked}
                          onCheckedChange={() =>
                            set("policies", toggle(values.policies, policy.id))
                          }
                        />
                        <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                          <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                            {policy.name}
                            {locked ? (
                              <Lock className="size-3 text-fg-subtle" aria-label="Always applied" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-fg-subtle">
                            {policy.description}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <fieldset>
                  <legend className="text-sm font-medium text-fg">Memory scopes</legend>
                  <div className="mt-3 space-y-2.5">
                    {["agent", "tenant", "workspace"].map((scope) => {
                      const checkboxId = `${id}-scope-${scope}`;
                      return (
                        <div key={scope} className="flex items-center gap-2.5">
                          <Checkbox
                            id={checkboxId}
                            checked={values.memoryScopes.includes(scope)}
                            onCheckedChange={() =>
                              set("memoryScopes", toggle(values.memoryScopes, scope))
                            }
                          />
                          <label htmlFor={checkboxId} className="cursor-pointer">
                            <Mono className="text-fg">{scope}</Mono>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
                <Field
                  id={`${id}-sandbox`}
                  label="Sandbox for code execution"
                  hint="Needed only if the agent runs code."
                >
                  <Select
                    id={`${id}-sandbox`}
                    value={values.sandbox ?? ""}
                    onChange={(event) => set("sandbox", event.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {sandboxTemplates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field id={`${id}-concurrency`} label="Concurrent runs">
                  <Input
                    id={`${id}-concurrency`}
                    type="number"
                    min={1}
                    max={500}
                    value={values.concurrency}
                    onChange={(event) =>
                      set("concurrency", Math.max(1, Number(event.target.value) || 1))
                    }
                  />
                </Field>
                <Field id={`${id}-duration`} label="Maximum duration">
                  <Select
                    id={`${id}-duration`}
                    value={values.maxDuration}
                    onChange={(event) => set("maxDuration", event.target.value)}
                  >
                    {["5m", "10m", "30m", "2h", "24h"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id={`${id}-budget`} label="Daily budget (USD)">
                  <Input
                    id={`${id}-budget`}
                    type="number"
                    min={0}
                    step={50}
                    value={values.dailyBudgetUsd}
                    onChange={(event) =>
                      set("dailyBudgetUsd", Math.max(0, Number(event.target.value) || 0))
                    }
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-fg">Review and deploy</p>
                <p className="mt-1 text-[13px] text-fg-muted">
                  This manifest is what gets versioned and deployed. Go back to change anything.
                </p>
              </div>
              <CodeBlock code={manifest} language="yaml" title="agent manifest" lineNumbers />
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0}
              onClick={() => goTo(Math.max(step - 1, 0))}
            >
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={next}>
                Continue
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <GateButton
                  gate="generic"
                  source="console:save-draft"
                  variant="secondary"
                  size="sm"
                >
                  Save as draft
                </GateButton>
                <GateButton gate="deploy-agent" size="sm">
                  <Rocket aria-hidden="true" />
                  Deploy agent
                </GateButton>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
