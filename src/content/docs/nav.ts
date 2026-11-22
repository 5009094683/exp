export type DocsNavItem = {
  /** Empty for the introduction at /docs. */
  slug: string;
  title: string;
  description: string;
};

export type DocsNavGroup = { title: string; items: DocsNavItem[] };

export const docsNav: DocsNavGroup[] = [
  {
    title: "Get started",
    items: [
      {
        slug: "",
        title: "Introduction",
        description: "What the platform does and how the pieces fit together.",
      },
      {
        slug: "concepts",
        title: "Core concepts",
        description: "Workspaces, agents, runs, steps, tools, policies and scopes.",
      },
      {
        slug: "agents",
        title: "Define an agent",
        description: "The agent manifest: model, instructions, triggers, tools and limits.",
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        slug: "orchestration",
        title: "Orchestration",
        description: "Workflows, triggers, retries, approvals and versions.",
      },
      {
        slug: "memory",
        title: "Memory",
        description: "Scopes, retention, redaction and recall for context that outlives a run.",
      },
      {
        slug: "integrations",
        title: "MCP integrations",
        description:
          "Connect MCP servers, choose how calls authenticate and set per-tool permissions.",
      },
      {
        slug: "permissions",
        title: "Permissions and policies",
        description: "Write, test and enforce policies, with approvals for high-risk actions.",
      },
      {
        slug: "audit-logs",
        title: "Audit logs",
        description: "The audit event schema, tamper evidence, search and export.",
      },
      {
        slug: "sandboxes",
        title: "Sandboxed execution",
        description: "Templates, limits and network rules for agent code.",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        slug: "api",
        title: "API overview",
        description: "Authentication, resources and conventions of the REST API.",
      },
    ],
  },
];

export const docsPages: DocsNavItem[] = docsNav.flatMap((group) => group.items);

export function docsHref(slug: string): "/docs" | `/docs/${string}` {
  return slug === "" ? "/docs" : `/docs/${slug}`;
}
