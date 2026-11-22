import "server-only";

import { buildTime } from "@/config/build";
import { site } from "@/config/site";
import {
  agentManifest,
  apiRunRequest,
  auditEventSample,
  integrationManifest,
  memoryManifest,
  policyManifest,
  sandboxManifest,
  workflowManifest,
  type CodeSample,
} from "@/content/samples";
import { runs } from "@/demo/runs";
import { ROLE_DESCRIPTIONS, type MemberRole } from "@/demo/workspace";
import { docsHref, docsPages } from "./nav";
import type { DocBlock, DocPage } from "./types";

const product = site.product.name;
const apiBase = `https://${site.apiHost}/v1`;

const p = (text: string): DocBlock => ({ type: "p", text });
const list = (...items: string[]): DocBlock => ({ type: "list", items });
const steps = (...items: string[]): DocBlock => ({ type: "list", ordered: true, items });
const code = (sample: CodeSample): DocBlock => ({ type: "code", sample });
const table = (head: string[], rows: string[][]): DocBlock => ({ type: "table", head, rows });

function h2(text: string, id?: string): DocBlock {
  return {
    type: "h2",
    text,
    id:
      id ??
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
  };
}

const roles = (Object.keys(ROLE_DESCRIPTIONS) as MemberRole[]).map((role) => [
  role,
  ROLE_DESCRIPTIONS[role],
]);

const iso = (minutesAgo: number) => new Date(buildTime - minutesAgo * 60_000).toISOString();
const json = (value: unknown) => JSON.stringify(value, null, 2);

// API samples reuse runs from the demo workspace, so identifiers match the console.
const startedRun =
  runs.find((run) => run.agentSlug === "support-triage" && run.status === "running") ?? runs[0];
const waitingRun = runs.find((run) => run.status === "awaiting_approval") ?? runs[0];
const waitingStep = waitingRun.steps.find((step) => step.status === "waiting");

const runAccepted: CodeSample = {
  filename: "Response",
  language: "http",
  code: `HTTP/1.1 202 Accepted
Content-Type: application/json

${json({
  id: startedRun.id,
  agent: startedRun.agentSlug,
  version: startedRun.version,
  status: "running",
  created_at: iso(startedRun.startedMinutesAgo),
})}
`,
};

// One step per line keeps the sample short enough to read at a glance.
const runSteps = waitingRun.steps
  .filter((step) => step.status !== "pending")
  .map((step) => {
    const name = step.kind === "trigger" ? waitingRun.trigger.type : step.ref;
    const status = step.status === "ok" ? "completed" : step.status;
    return `    { "kind": "${step.kind}", "name": ${JSON.stringify(name)}, "status": "${status}" }`;
  })
  .join(",\n");

const runDetail: CodeSample = {
  filename: `GET /v1/runs/${waitingRun.id}`,
  language: "json",
  code: `{
  "id": "${waitingRun.id}",
  "agent": "${waitingRun.agentSlug}",
  "version": ${waitingRun.version},
  "status": "${waitingRun.status}",
  "created_at": "${iso(waitingRun.startedMinutesAgo)}",
  "steps": [
${runSteps}
  ],
  "waiting_for": {
    "approvers": [${JSON.stringify(waitingStep?.ref ?? "group:approvers")}],
    "policy": "${waitingStep?.policy?.id ?? "production-changes"}"
  },
  "output": null
}
`,
};

const errorSample: CodeSample = {
  filename: "Error response",
  language: "http",
  code: `HTTP/1.1 403 Forbidden
Content-Type: application/json

${json({
  error: {
    code: "policy_denied",
    message: "Tool is not granted to this agent.",
    policy: "least-privilege",
    request_id: "req_8f2k4m9x1q7d",
  },
})}
`,
};

const content: Record<string, DocBlock[]> = {
  "": [
    p(
      `${product} is a platform for running autonomous AI agents in production. You describe what an agent is for and what it may use. The platform runs it, checks every action against policy and keeps a record of what happened.`,
    ),
    p(
      "These pages cover the concepts, the manifest formats and the API. To see the product itself, open the [demo console](/console), a read-only workspace filled with sample data.",
    ),
    h2("How it fits together"),
    p(
      "An agent is a versioned definition: a model profile, instructions, triggers, the tools it may call and its limits. Each time a trigger fires, the platform starts a **run**. A run is a durable workflow made of steps, and every step passes through the same control points.",
    ),
    steps(
      "**Orchestration** starts the run, saves its state after each step and retries failures.",
      "**Policy** evaluates each tool call, memory access and model request before it happens.",
      "The **MCP gateway** attaches credentials and calls the tool on the agent's behalf.",
      "**Memory** supplies context from the scopes the agent has been granted.",
      "**Sandboxes** run any code the agent writes, isolated from everything else.",
      "The **audit log** records every step, decision and approval.",
    ),
    h2("Where to go next", "next"),
    {
      type: "cards",
      items: docsPages
        .filter((page) => page.slug !== "")
        .map((page) => ({
          title: page.title,
          description: page.description,
          href: docsHref(page.slug),
        })),
    },
    h2("Getting access", "access"),
    p(
      `${product} is in early access, and workspaces are set up with each team. [Request access](/early-access) to run agents against your own systems.`,
    ),
  ],

  concepts: [
    p(
      "A small set of objects appears throughout the product. This page defines each of them and shows how they relate.",
    ),
    h2("Workspace"),
    p(
      "A workspace is the top-level container for agents, integrations, policies, memory and logs. It lives in one data region and has its own members, roles and environments. Most companies use a single workspace with a staging and a production environment.",
    ),
    h2("Agent"),
    p(
      "An agent is a versioned definition of a job: which model profile to use, what the instructions are, what starts it, which tools it may call and what its limits are. Deploying a change creates a new version, and earlier versions stay available for rollback. See [Define an agent](/docs/agents).",
    ),
    h2("Run and steps", "runs"),
    p(
      "A run is one execution of an agent, from trigger to final output. It is made of steps, and each step is recorded with its input, output, duration and cost.",
    ),
    table(
      ["Step", "What it records"],
      [
        ["Trigger", "The event, schedule or API call that started the run."],
        ["Model", "A request to a model profile, with token counts."],
        ["Tool", "A call to an MCP tool, and the policy decision that allowed it."],
        ["Memory", "A read from or a write to a memory scope."],
        ["Sandbox", "Code executed in a sandbox, with its output and network attempts."],
        ["Approval", "A pause while a person decides, and who decided."],
        ["Output", "The result returned to the caller or written to a system."],
      ],
    ),
    p("A run is always in one of six states."),
    table(
      ["Status", "Meaning"],
      [
        ["`running`", "Steps are executing."],
        ["`awaiting_approval`", "Paused until an approver decides or the approval times out."],
        ["`succeeded`", "Every step completed."],
        ["`failed`", "A step failed after its retries. The run can be resumed from that step."],
        ["`blocked`", "A policy denied an action the run needed."],
        ["`cancelled`", "Stopped by a person or through the API."],
      ],
    ),
    h2("Tools and integrations", "tools"),
    p(
      "Tools come from MCP servers connected to the workspace. A tool is addressed as `server.tool`, for example `zendesk.get_ticket`. Each tool has a workspace-wide permission, and an agent only receives the tools listed in its manifest. See [MCP integrations](/docs/integrations).",
    ),
    h2("Policy"),
    p(
      "A policy is a set of rules evaluated before an action runs. Each rule has one of three effects: `allow`, `require_approval` or `deny`. When no rule allows an action, it is denied. See [Permissions and policies](/docs/permissions).",
    ),
    h2("Memory scope"),
    p(
      "Memory is stored in scopes. A scope sets who shares the entries, how long they are kept and what is redacted before they are stored. See [Memory](/docs/memory).",
    ),
    h2("Sandbox"),
    p(
      "A sandbox is a short-lived, isolated environment for code that an agent writes. It starts from a template with no credentials and no network access. See [Sandboxed execution](/docs/sandboxes).",
    ),
    h2("Environment"),
    p(
      "Environments separate configuration, credentials and traffic. An agent version is promoted from one environment to the next, and each API key belongs to a single environment.",
    ),
    h2("Members and roles", "roles"),
    p("People sign in through your identity provider. Each member has one role."),
    table(["Role", "Can do"], roles),
  ],

  agents: [
    p(
      "An agent is defined in a manifest. The manifest is what gets reviewed, versioned and deployed, whether you write it by hand or build it in the console.",
    ),
    code(agentManifest),
    h2("Fields"),
    table(
      ["Field", "Description"],
      [
        ["`name`", "Unique within the workspace. Lowercase letters, numbers and hyphens."],
        ["`description`", "One sentence. Shown in lists and in approval requests."],
        ["`model`", "The model profile to use: `fast`, `balanced` or `reasoning`."],
        ["`instructions`", "What the agent should do, inline or as a path to a file."],
        ["`triggers`", "What starts a run."],
        ["`tools`", "The tools the agent may call, written as `server.tool`."],
        [
          "`policies`",
          "Optional. Policies attached to this agent in addition to the workspace defaults.",
        ],
        ["`memory`", "The scopes the agent can read and write."],
        ["`sandbox`", "Optional. The sandbox template used when the agent runs code."],
        ["`limits`", "Concurrency, maximum run duration and a daily budget."],
      ],
    ),
    h2("Model profiles"),
    p(
      "Agents ask for a profile, not a specific model. Which provider and model serve each profile is a workspace setting, so you can change providers or add a fallback without editing agents.",
    ),
    table(
      ["Profile", "Intended for"],
      [
        ["`fast`", "Low-latency work such as classification and routing."],
        ["`balanced`", "General-purpose reasoning and drafting."],
        ["`reasoning`", "Multi-step analysis for high-stakes work."],
      ],
    ),
    p(
      "Model usage is billed by your model provider, through your own accounts. See [pricing](/pricing).",
    ),
    h2("Triggers"),
    table(
      ["Trigger", "Starts a run when"],
      [
        ["`webhook`", "A connected system sends an event, such as `zendesk/ticket.created`."],
        [
          "`event`",
          "An event arrives on a subscribed stream, such as `pagerduty/incident.triggered`.",
        ],
        ["`schedule`", "A cron expression matches. Schedules use UTC."],
        [
          "API",
          "A client calls the runs endpoint. Every agent can be started this way. See the [API overview](/docs/api).",
        ],
        ["Agent", "Another agent calls this one as a tool."],
      ],
    ),
    h2("Limits"),
    p(
      "Limits are enforced by the platform, outside the model, so an agent cannot talk its way past them.",
    ),
    table(
      ["Limit", "Effect"],
      [
        ["`concurrency`", "The number of runs in progress at once. Further runs wait in a queue."],
        [
          "`max_duration`",
          "A run that exceeds it is stopped and marked as failed. Time spent waiting for an approval does not count.",
        ],
        [
          "`daily_budget_usd`",
          "Model spend per day. A policy decides what happens when it is reached.",
        ],
      ],
    ),
    h2("Versions and rollout", "versions"),
    p(
      "Every deployment creates a new version. A new version can start on a share of traffic while the current one serves the rest. Promote it when the results hold up, or roll back in one step. Each run records the version that served it.",
    ),
    p(
      "Before promoting a version, replay recent runs against it and compare the outputs with what the current version produced.",
    ),
    h2("Build one in the console", "console"),
    p(
      "The [new agent form](/console/agents/new) in the demo console builds the same manifest step by step and shows the result before anything is deployed.",
    ),
  ],

  orchestration: [
    p(
      "Every run is a durable workflow. Its state is saved after each step, so a run can wait for an approval, survive a restart and continue where it stopped.",
    ),
    h2("Planned and explicit steps", "steps"),
    p(
      "By default an agent plans its own steps, within its tools, policies and limits. Add a `steps` section when the order matters, for example when a person has to approve before anything is changed.",
    ),
    code(workflowManifest),
    table(
      ["Key", "Description"],
      [
        ["`tool`", "Call one tool."],
        ["`model`", "Ask a model profile to reason over what has been gathered so far."],
        ["`parallel`", "Run several steps at the same time and continue when all have finished."],
        ["`approval`", "Pause until a person approves or rejects."],
        ["`retry`", "The number of attempts and the backoff between them."],
      ],
    ),
    h2("Durable execution"),
    p(
      "When a worker restarts or a provider times out, the run continues from the last completed step. Completed steps are not run again.",
    ),
    p(
      "A step that is retried may reach a tool more than once. The gateway sends the same idempotency key on every attempt of a step, so servers that support it apply the change once.",
    ),
    h2("Retries and failures", "retries"),
    p(
      "A failed step is retried with the backoff you set. If it still fails, the run stops at that step with its state intact and is marked as `failed`. Fix the cause and resume the run, or cancel it.",
    ),
    h2("Approvals"),
    p(
      "An approval step pauses the run and notifies the approvers. A paused run holds no compute and can wait for as long as its timeout allows.",
    ),
    table(
      ["Key", "Description"],
      [
        [
          "`approvers`",
          "A group (`group:finance-controllers`), an on-call schedule (`oncall:platform`) or a person's manager (`manager_of:args.user`).",
        ],
        ["`channel`", "Where the request is sent: `slack`, `email` or `console`."],
        ["`timeout`", "How long to wait for a decision."],
        ["`on_timeout`", "`deny` the action, or `escalate` to the next approver."],
      ],
    ),
    p(
      "Approvals can be written into a workflow, as above, or required by a policy for specific actions. See [Permissions and policies](/docs/permissions).",
    ),
    h2("Agents calling agents", "handoffs"),
    p(
      "An agent can be exposed to other agents as a tool. The child run appears inside the parent's trace, and it inherits the caller's permissions unless a policy narrows them.",
    ),
    h2("Concurrency"),
    p(
      "Limits can be set for an agent, a tool or a tenant. Work beyond a limit waits in a queue, so a burst of events does not overwhelm a downstream system.",
    ),
    h2("Traces"),
    p(
      "Each run has one trace: the plan, model calls, tool calls, policy decisions, approvals and output on a single timeline, with tokens, cost and duration for every step. The [runs view](/console/runs) in the demo console shows several.",
    ),
  ],

  memory: [
    p(
      "Memory gives agents context that lasts beyond one run. Every entry belongs to a scope, records where it came from and expires on a schedule you set.",
    ),
    code(memoryManifest),
    h2("Scopes"),
    table(
      ["Scope", "Shared by", "Typical use"],
      [
        ["`run`", "One run", "Working notes. Deleted when the run ends."],
        ["`agent`", "All runs of one agent", "What the agent has learned about doing its job."],
        [
          "`tenant`",
          "Runs that act for the same customer",
          "Customer context, kept apart from every other tenant.",
        ],
        ["`workspace`", "Every agent", "Curated knowledge such as playbooks. Written by admins."],
      ],
    ),
    p(
      "A scope with a `key` has one isolated store for each value of the key. The platform takes the key from the run's context, so an agent cannot ask for another tenant's store.",
    ),
    h2("Reading and writing", "operations"),
    p(
      "Agents use memory through three built-in tools. Like any other tool call, each one is checked against policy and recorded in the trace.",
    ),
    table(
      ["Tool", "Description"],
      [
        ["`memory.read`", "Fetch an entry by key."],
        ["`memory.search`", "Find entries by meaning or by filter."],
        ["`memory.write`", "Store an entry as a fact, a preference, an episode or a document."],
      ],
    ),
    h2("Retention and deletion", "retention"),
    p(
      "`retention` is the time an entry lives after it is written. Expired entries are removed without any action from you. Entries can also be purged by key, by user or by tenant, which is how deletion requests are handled.",
    ),
    p(
      "Each purge is recorded in the audit log. The record says what was removed and who asked, without the content.",
    ),
    h2("Redaction"),
    p(
      "`redact` lists the kinds of data to detect before an entry is stored. Detected values are replaced with a placeholder such as `[redacted email]`, and the entry records how many values were replaced.",
    ),
    h2("Provenance"),
    p(
      "Each entry stores the run that wrote it, the agent or person who wrote it and the time. When an answer looks wrong, open the run to see which entries were read and follow each one back to its source.",
    ),
    p(
      "The [memory view](/console/memory) in the demo console shows scopes and a sample of entries.",
    ),
  ],

  integrations: [
    p(
      `${product} connects agents to tools through the [Model Context Protocol](https://modelcontextprotocol.io), an open standard. A server exposes tools, and the gateway calls them on behalf of agents.`,
    ),
    code(integrationManifest),
    h2("Connect a server", "connect"),
    steps(
      "Register the server with its URL and transport.",
      "Choose how calls authenticate.",
      "Review the tools the server exposes and set a permission for each one.",
      "Grant tools to agents in their manifests.",
    ),
    h2("Transports"),
    table(
      ["Transport", "Use for"],
      [
        ["`streamable-http`", "Remote servers reachable over HTTPS."],
        [
          "`connector`",
          "Servers inside your network. A connector you deploy opens an outbound connection to the platform, so no inbound firewall rule is needed.",
        ],
      ],
    ),
    h2("Authentication"),
    table(
      ["Setting", "Calls are made as"],
      [
        [
          "`type: oauth` with `identity: user`",
          "The person the run acts for. The agent sees only what that person can see.",
        ],
        ["`type: oauth` with `identity: service`", "A service account shared by all runs."],
        ["`type: api_key`", "A key stored in the vault."],
      ],
    ),
    p(
      "Tokens and keys are stored encrypted and attached by the gateway when a call is made. They are never placed in a prompt or returned to the model.",
    ),
    h2("Tool permissions", "permissions"),
    table(
      ["Permission", "Effect"],
      [
        ["`allow`", "Agents that have been granted the tool can call it."],
        ["`require_approval`", "Each call waits for a person to approve it."],
        ["`deny`", "No agent can call the tool."],
      ],
    ),
    p(
      "A tool that is not listed is denied. These permissions are the most any agent can do with a tool. An agent's manifest and your policies can narrow them, never widen them.",
    ),
    h2("Health and usage", "health"),
    p(
      "The console shows call volume, latency and error rate for each server and tool, and marks a server as degraded when its error rate rises. See the [integrations view](/console/integrations).",
    ),
  ],

  permissions: [
    p(
      "Policies decide what agents may do. They are evaluated in the execution path, before a tool call, a memory access or a model request runs, and each decision is recorded with the rule that produced it.",
    ),
    code(policyManifest),
    h2("How a decision is made", "evaluation"),
    steps(
      "The policies whose `applies_to` matches the action are collected. A policy can apply to tools, agents, sandboxes or the whole workspace.",
      "Within a policy, rules are read from top to bottom, and the first rule whose `when` matches gives the policy's answer. A rule without `when` always matches.",
      "Across policies, the strictest answer wins: `deny` over `require_approval` over `allow`.",
      "If no policy allows the action, it is denied.",
    ),
    h2("Effects"),
    table(
      ["Effect", "Result"],
      [
        ["`allow`", "The action runs."],
        ["`require_approval`", "The run pauses until an approver decides."],
        [
          "`deny`",
          "The action does not run. The run is marked as blocked and shows the rule's `reason`.",
        ],
      ],
    ),
    h2("Conditions"),
    p("A `when` expression compares values from the request."),
    table(
      ["Value", "Contains"],
      [
        ["`args`", "The arguments of the tool call, such as `args.amount`."],
        ["`agent`", "The agent, its granted tools, its budget and its spend today."],
        ["`run.context`", "Values set by the trigger, such as a ticket's priority."],
        ["`request`", "For sandbox network rules, the host being contacted."],
      ],
    ),
    p(
      "Expressions support comparisons, `and`, `or` and `in`, and helpers such as `pii(email, phone)`, which matches when the arguments contain personal data of those kinds.",
    ),
    h2("Approvals"),
    p(
      "A `require_approval` rule names the approvers, the channel, a timeout and what happens when the timeout passes. Approvers decide from chat, by email or in the console, and they see the agent, the action and its arguments before deciding.",
    ),
    h2("Monitor mode"),
    p(
      "A policy with `mode: monitor` is evaluated but not enforced. Its decisions are logged as what would have happened, so you can measure a new rule on real traffic before switching it to `enforce`.",
    ),
    h2("Tests"),
    p(
      "Each policy carries example requests and the decision each one must get. Tests run whenever the policy changes, and a change that fails a test is not deployed.",
    ),
    h2("Roles and sign-in", "roles"),
    p(
      "Policies govern agents. Roles govern people. Members sign in through your identity provider, and its groups can be mapped to roles and to approval groups.",
    ),
    table(["Role", "Can do"], roles),
    p(
      "The [policies view](/console/policies) in the demo console shows policies with their tests and recent decisions.",
    ),
  ],

  "audit-logs": [
    p(
      "The audit log records what every agent and person did in a workspace. It is append-only: events are added and never edited.",
    ),
    code(auditEventSample(new Date(buildTime))),
    h2("Event fields", "fields"),
    table(
      ["Field", "Description"],
      [
        ["`id`", "Unique identifier of the event."],
        ["`time`", "When it happened, in UTC."],
        ["`actor`", "Who acted: an agent, a user or the system."],
        ["`action`", "What happened, written as `category.verb`."],
        ["`resource`", "What it happened to."],
        ["`agent`", "The agent and version, when the event belongs to a run."],
        ["`policy`", "The policy that decided, when one was evaluated."],
        ["`outcome`", "The result of the action."],
        ["`prev_hash` and `hash`", "Link the event to the one before it."],
      ],
    ),
    h2("What is recorded", "actions"),
    table(
      ["Category", "Actions"],
      [
        ["Runs", "`run.start`, `run.complete`, `run.fail`, `run.cancel`"],
        ["Model calls", "`model.call`"],
        ["Tool calls", "`tool.call`"],
        ["Memory", "`memory.read`, `memory.write`, `memory.purge`"],
        ["Policy", "`policy.evaluate`"],
        ["Approvals", "`approval.request`, `approval.grant`, `approval.reject`"],
        ["Sandboxes", "`sandbox.exec`"],
        ["Configuration", "`agent.deploy`, `policy.update`, `integration.connect`"],
        ["Access", "`session.login`, `member.invite`, `apikey.create`, `audit.export`"],
      ],
    ),
    h2("Tamper evidence", "integrity"),
    p(
      "Every event includes the hash of the event before it. Removing or changing an event breaks the chain from that point on, which can be checked by recomputing the hashes over an export.",
    ),
    h2("Search"),
    p(
      "Filter events by actor, action, resource, outcome, run or time. From any event that belongs to a run, open the run's trace to see the surrounding steps.",
    ),
    h2("Export"),
    list(
      "Download a period as JSON or CSV.",
      "Stream events as JSON over HTTPS to a SIEM or a data lake.",
      "Deliver batches to object storage.",
    ),
    p("Exports are themselves recorded, as `audit.export` events."),
    h2("Content capture", "content"),
    p(
      "Prompts and outputs are stored with their events by default. Fields can be redacted, and content capture can be switched off for specific agents. The metadata of each event is always kept.",
    ),
    h2("Retention"),
    p(
      "Events are kept for the retention period of the workspace and removed when it ends. The period depends on the plan and can be extended. See [pricing](/pricing).",
    ),
    p(
      "The [audit log](/console/audit) in the demo console shows the events behind the sample runs.",
    ),
  ],

  sandboxes: [
    p(
      "When an agent writes code, the code runs in a sandbox: a short-lived environment with its own filesystem, no credentials and no network access unless you allow it.",
    ),
    code(sandboxManifest),
    h2("Templates"),
    p(
      "A template defines the environment a sandbox starts from. Agents refer to a template by name in their manifest.",
    ),
    table(
      ["Key", "Description"],
      [
        [
          "`image`",
          "The container image, pinned by digest so every sandbox starts from the same contents.",
        ],
        ["`resources`", "CPU, memory and disk, and the longest a sandbox may run."],
        ["`network`", "Outbound access. Denied by default, with an allowlist of hosts."],
        ["`credentials`", "What is mounted into the sandbox. Nothing, unless a task grants it."],
        ["`on_exit`", "What happens when the task ends. Sandboxes are destroyed."],
      ],
    ),
    h2("Lifecycle"),
    steps(
      "A step asks to run code. Policy is checked first.",
      "A sandbox starts from the template, and the files the task needs are mounted in.",
      "The command runs. Its output, exit code and resource use are captured.",
      "Artifacts are collected, and the sandbox is destroyed.",
    ),
    p(
      "Within one run, later steps can reuse a warm sandbox. Sandboxes are never shared between runs.",
    ),
    h2("Network access", "network"),
    p(
      "Outbound requests are checked against the template's allowlist and the hosts a task has been allowed. Anything else is blocked, and the attempt is listed in the trace.",
    ),
    h2("Limits"),
    p(
      "A sandbox that reaches its time limit is stopped, and the step fails with the reason. CPU, memory and disk are capped at the values in the template.",
    ),
    h2("What is captured", "capture"),
    list(
      "The command and its output.",
      "The exit code and duration.",
      "CPU time and peak memory.",
      "Every outbound request, allowed or blocked.",
    ),
    p(
      "The [sandboxes view](/console/sandboxes) in the demo console shows sessions and templates. Sandbox compute is metered by the vCPU-hour, as described under [pricing](/pricing).",
    ),
  ],

  api: [
    p(
      "The REST API manages agents, starts runs and reads their results. The console is built on the same API.",
    ),
    h2("Base URL", "base-url"),
    code({ filename: "Base URL", language: "text", code: `${apiBase}\n` }),
    p("Requests and responses are JSON over HTTPS. Timestamps are ISO 8601 in UTC."),
    h2("Authentication"),
    p(
      "Send an API key as a bearer token. Keys are created in the console under Settings. Each key belongs to one environment and carries scopes that limit what it can do.",
    ),
    table(
      ["Scope", "Allows"],
      [
        ["`agents:deploy`", "Create agents and deploy versions."],
        ["`runs:create`", "Start runs."],
        ["`runs:read`", "Read runs, steps and outputs."],
        ["`policies:write`", "Create and change policies."],
        ["`audit:read`", "Read and export audit events."],
        ["`usage:read`", "Read usage and billing data."],
      ],
    ),
    h2("Start a run", "start-a-run"),
    code(apiRunRequest),
    p("The request returns as soon as the run is accepted. The run continues in the background."),
    code(runAccepted),
    h2("Read a run", "read-a-run"),
    p(
      "Fetch a run to see its status, steps and output. A run that is waiting for an approval reports who it is waiting for.",
    ),
    code(runDetail),
    h2("Resources"),
    table(
      ["Path", "Resource"],
      [
        ["`/agents`", "Agent definitions and their versions."],
        ["`/agents/{name}/runs`", "Start a run of an agent."],
        ["`/runs/{id}`", "A run with its steps, status and output."],
        ["`/approvals`", "Pending approvals. Approve or reject them."],
        ["`/policies`", "Policies, their tests and their decisions."],
        ["`/integrations`", "Connected MCP servers and tool permissions."],
        ["`/memory/{scope}`", "Entries in a memory scope."],
        ["`/audit/events`", "Audit events."],
        ["`/sandboxes`", "Sandbox templates and sessions."],
      ],
    ),
    h2("Idempotency"),
    p(
      "Send an `Idempotency-Key` header with requests that create something. A repeated request with the same key returns the original result instead of starting a second run.",
    ),
    h2("Pagination"),
    p(
      "List endpoints return a page of results and a `next_cursor`. Pass it as the `cursor` parameter to get the next page. When `next_cursor` is `null`, there are no more results.",
    ),
    h2("Errors"),
    p("Errors use standard HTTP status codes and a JSON body with a stable `code`."),
    code(errorSample),
    table(
      ["Status", "Code", "Meaning"],
      [
        ["400", "`invalid_request`", "The request could not be parsed."],
        ["401", "`unauthenticated`", "The API key is missing or not valid."],
        ["403", "`forbidden`", "The key lacks the scope for this request."],
        ["403", "`policy_denied`", "A policy denied the action."],
        ["404", "`not_found`", "The resource does not exist in this environment."],
        ["409", "`conflict`", "The resource changed since it was read."],
        ["422", "`validation_failed`", "A field is missing or not valid."],
        ["429", "`rate_limited`", "Too many requests. Retry after the time in `Retry-After`."],
      ],
    ),
    h2("Webhooks"),
    p(
      "Subscribe to events such as `run.completed`, `run.failed` and `approval.requested` to react without polling. Each delivery is signed, so you can verify that it came from your workspace.",
    ),
  ],
};

export const docs: DocPage[] = docsPages.map((page) => ({
  slug: page.slug,
  title: page.title,
  description: page.description,
  blocks: content[page.slug] ?? [],
}));

export function getDocsPage(slug: string): DocPage | undefined {
  return docs.find((page) => page.slug === slug);
}
