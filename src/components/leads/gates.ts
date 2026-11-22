/**
 * Copy for the points in the demo console where a real product would commit a
 * change. `{product}` is replaced with the configured product name.
 */
export const GATES = {
  "deploy-agent": {
    title: "Deploy your own agents",
    description:
      "This is a demo workspace with sample data, so nothing here can be deployed. Request access and we'll set up a workspace for your team.",
  },
  "run-agent": {
    title: "Run agents on your own workloads",
    description:
      "Runs in the demo workspace are read-only samples. Request access to trigger runs against your own tools and data.",
  },
  "connect-mcp": {
    title: "Connect your MCP servers",
    description:
      "The demo workspace uses sample servers. Request access to register your own MCP servers and choose which tools each agent can call.",
  },
  "save-policy": {
    title: "Enforce your own policies",
    description:
      "Policies in the demo workspace are read-only. Request access to write, test and enforce policies for your agents.",
  },
  "create-api-key": {
    title: "Create API keys",
    description:
      "API keys are issued to early-access workspaces. Request access and we'll get your team set up.",
  },
  "invite-member": {
    title: "Invite your team",
    description:
      "Member management is available in early-access workspaces. Request access to bring your team in with single sign-on and role-based permissions.",
  },
  "export-audit": {
    title: "Export audit logs",
    description:
      "Exports are turned off for the sample data in this demo. Request access to export or stream your own audit events.",
  },
  "sign-in": {
    title: "{product} is invite-only for now",
    description:
      "Workspaces are being opened to early-access teams. Request access and we'll follow up with next steps.",
  },
  generic: {
    title: "Available with early access",
    description:
      "This action is turned off in the demo workspace. Request access to use it with your own agents and data.",
  },
} as const satisfies Record<string, { title: string; description: string }>;

export type GateId = keyof typeof GATES;
