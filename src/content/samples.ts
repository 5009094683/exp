import "server-only";

import { site } from "@/config/site";
import { getPolicy } from "@/demo/policies";
import { showcaseRun } from "@/demo/runs";
import type { CodeLanguage } from "@/lib/highlight";

/**
 * Configuration and API samples shown across the site. They describe the
 * planned interface and are labelled as a preview wherever they appear.
 */

export type CodeSample = { filename: string; language: CodeLanguage; code: string };

export const agentManifest: CodeSample = {
  filename: "agents/support-triage.yaml",
  language: "yaml",
  code: `name: support-triage
description: Classify inbound tickets and draft a first reply.
model: balanced
instructions: prompts/support-triage.md

triggers:
  - webhook: zendesk/ticket.created
  - schedule: "*/15 * * * *"   # sweep for unassigned tickets

tools:
  - zendesk.get_ticket
  - zendesk.add_comment
  - knowledge-base.search

memory:
  scopes: [tenant, agent]
  retention: 180d

limits:
  concurrency: 50
  max_duration: 10m
  daily_budget_usd: 600
`,
};

export const integrationManifest: CodeSample = {
  filename: "integrations/github.yaml",
  language: "yaml",
  code: `server: github
transport: streamable-http
url: https://mcp.github.example/mcp

auth:
  type: oauth
  identity: user   # act with each person's own access

# What each tool is allowed to do. Unlisted tools are denied.
tools:
  get_pull_request: allow
  get_diff: allow
  create_review: allow
  rollback_deployment: require_approval
  merge_pull_request: require_approval
  delete_branch: deny
`,
};

export const policyManifest: CodeSample = {
  filename: "policies/payments-over-1000.yaml",
  language: "yaml",
  code: getPolicy("payments-over-1000")?.source ?? "",
};

export const sandboxManifest: CodeSample = {
  filename: "sandboxes/node-ci.yaml",
  language: "yaml",
  code: `name: node-ci
image: node:22-ci@sha256:9b07d1f3   # pinned by digest

resources:
  cpu: 4
  memory: 8Gi
  disk: 16Gi
  timeout: 20m

network:
  egress: deny                 # default
  allow:
    - registry.npmjs.org

credentials: none              # nothing is mounted unless a task grants it
on_exit: destroy
`,
};

export const memoryManifest: CodeSample = {
  filename: "memory/scopes.yaml",
  language: "yaml",
  code: `scopes:
  - name: tenant
    key: "{{ run.tenant_id }}"   # one isolated store per customer
    retention: 180d
    redact: [email, phone, payment_card]

  - name: agent
    retention: 90d

  - name: workspace
    retention: none              # curated knowledge, managed by admins
    write: [role:admin]
`,
};

export const workflowManifest: CodeSample = {
  filename: "agents/incident-responder.yaml",
  language: "yaml",
  code: `name: incident-responder
model: reasoning

triggers:
  - event: pagerduty/incident.triggered

steps:
  - id: gather
    parallel:
      - tool: datadog.query_metrics
      - tool: datadog.search_logs
      - tool: github.list_deployments
    retry: { attempts: 3, backoff: exponential }

  - id: plan
    model: reasoning

  - id: approve
    approval:
      approvers: ["oncall:platform"]
      channel: slack
      timeout: 15m

  - id: remediate
    tool: github.rollback_deployment
`,
};

/** A real event shape from the sample run, with timestamps relative to the build. */
export function auditEventSample(now: Date): CodeSample {
  const approval = showcaseRun.steps.find((step) => step.kind === "approval");
  return {
    filename: "audit event",
    language: "json",
    code: `${JSON.stringify(
      {
        id: "evt_01jd8k2m9x4q7f",
        time: new Date(now.getTime() - 14 * 60_000).toISOString(),
        actor: { type: "user", id: "priya.natarajan" },
        action: "approval.grant",
        resource: { type: "run", id: showcaseRun.id },
        agent: `${showcaseRun.agentSlug}@${showcaseRun.version}`,
        policy: approval?.policy?.id ?? "production-changes",
        outcome: "approved",
        prev_hash: "1e88c0d4…f4a0",
        hash: "7c21aa93…09bd",
      },
      null,
      2,
    )}\n`,
  };
}

export const apiRunRequest: CodeSample = {
  filename: "Start a run",
  language: "bash",
  code: `curl https://${site.apiHost}/v1/agents/support-triage/runs \\
  -H "Authorization: Bearer $${site.product.slug.toUpperCase().replace(/-/g, "_")}_API_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{"input": {"ticket_id": 48213}}'
`,
};
