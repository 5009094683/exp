export type ToolPermission = "allow" | "approval" | "deny";

export type McpTool = {
  name: string;
  description: string;
  permission: ToolPermission;
  /** Whether the tool changes data in the connected system. */
  mutates: boolean;
};

export type McpServer = {
  id: string;
  name: string;
  category: string;
  description: string;
  kind: "catalog" | "custom";
  transport: "Streamable HTTP" | "Private connector";
  url: string;
  auth: "OAuth 2.1" | "API key" | "Service account" | "mTLS";
  /** Whose access a call uses: the end user's or a shared service identity. */
  identity: "Per-user delegation" | "Service identity";
  status: "connected" | "degraded";
  tools: McpTool[];
  calls24h: number;
  p50Ms: number;
  errorRate: number;
  lastCallMinutesAgo: number;
  connectedDaysAgo: number;
};

const read = (name: string, description: string): McpTool => ({
  name,
  description,
  permission: "allow",
  mutates: false,
});
const write = (name: string, description: string): McpTool => ({
  name,
  description,
  permission: "allow",
  mutates: true,
});
const gated = (name: string, description: string): McpTool => ({
  name,
  description,
  permission: "approval",
  mutates: true,
});
const blocked = (name: string, description: string): McpTool => ({
  name,
  description,
  permission: "deny",
  mutates: true,
});

/** MCP servers connected to the demo workspace. Names are examples; the data is sample data. */
export const servers: McpServer[] = [
  {
    id: "zendesk",
    name: "Zendesk",
    category: "Support",
    description: "Tickets, comments and customer history.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.zendesk.example/mcp",
    auth: "OAuth 2.1",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("get_ticket", "Read a ticket with its comments."),
      read("search_tickets", "Search tickets by query."),
      write("add_comment", "Add a public or internal comment."),
      write("update_ticket", "Change status, priority or assignee."),
      blocked("delete_ticket", "Permanently delete a ticket."),
    ],
    calls24h: 18420,
    p50Ms: 212,
    errorRate: 0.002,
    lastCallMinutesAgo: 0,
    connectedDaysAgo: 96,
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    description: "Messages, channels and approval prompts.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.slack.example/mcp",
    auth: "OAuth 2.1",
    identity: "Service identity",
    status: "connected",
    tools: [
      write("post_message", "Post a message to a channel or thread."),
      read("list_channels", "List channels the app can see."),
      gated("read_channel_history", "Read recent messages in a channel."),
      blocked("invite_user", "Invite a user to a channel."),
    ],
    calls24h: 9614,
    p50Ms: 164,
    errorRate: 0.001,
    lastCallMinutesAgo: 1,
    connectedDaysAgo: 112,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Engineering",
    description: "Pull requests, reviews and deployments.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.github.example/mcp",
    auth: "OAuth 2.1",
    identity: "Per-user delegation",
    status: "connected",
    tools: [
      read("get_pull_request", "Read a pull request and its metadata."),
      read("get_diff", "Read the diff of a pull request."),
      read("list_deployments", "List recent deployments for a service."),
      write("create_review", "Submit a review with comments."),
      gated("rollback_deployment", "Roll a service back to a previous release."),
      gated("merge_pull_request", "Merge a pull request."),
      blocked("delete_branch", "Delete a branch."),
    ],
    calls24h: 6230,
    p50Ms: 248,
    errorRate: 0.004,
    lastCallMinutesAgo: 2,
    connectedDaysAgo: 88,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Leads, accounts and opportunities.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.salesforce.example/mcp",
    auth: "OAuth 2.1",
    identity: "Per-user delegation",
    status: "connected",
    tools: [
      read("get_lead", "Read a lead record."),
      read("get_account", "Read an account with its contacts."),
      write("update_lead", "Update fields on a lead."),
      gated("create_opportunity", "Create an opportunity on an account."),
      blocked("delete_record", "Delete any record."),
    ],
    calls24h: 7120,
    p50Ms: 305,
    errorRate: 0.003,
    lastCallMinutesAgo: 3,
    connectedDaysAgo: 74,
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Payments, refunds and subscriptions.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.stripe.example/mcp",
    auth: "API key",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("get_payment_intent", "Read a payment and its risk signals."),
      read("list_charges", "List charges for a customer."),
      gated("create_refund", "Refund a payment in full or in part."),
      gated("update_subscription", "Change a customer's subscription."),
    ],
    calls24h: 11890,
    p50Ms: 187,
    errorRate: 0.002,
    lastCallMinutesAgo: 0,
    connectedDaysAgo: 61,
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    category: "Operations",
    description: "Incidents, notes and on-call schedules.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.pagerduty.example/mcp",
    auth: "API key",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("get_incident", "Read an incident and its timeline."),
      write("add_note", "Add a note to an incident."),
      gated("resolve_incident", "Resolve an incident."),
    ],
    calls24h: 412,
    p50Ms: 231,
    errorRate: 0,
    lastCallMinutesAgo: 14,
    connectedDaysAgo: 58,
  },
  {
    id: "datadog",
    name: "Datadog",
    category: "Observability",
    description: "Metrics, logs and monitors.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.datadog.example/mcp",
    auth: "API key",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("query_metrics", "Run a metrics query over a time range."),
      read("search_logs", "Search logs with a filter."),
      gated("mute_monitor", "Mute a monitor for a period."),
    ],
    calls24h: 1284,
    p50Ms: 412,
    errorRate: 0.006,
    lastCallMinutesAgo: 14,
    connectedDaysAgo: 58,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    category: "Data",
    description: "Warehouse queries through a read-only role.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.snowflake.example/mcp",
    auth: "Service account",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("query", "Run a read-only SQL query."),
      read("describe_table", "Read a table's columns and types."),
    ],
    calls24h: 5376,
    p50Ms: 890,
    errorRate: 0.008,
    lastCallMinutesAgo: 6,
    connectedDaysAgo: 43,
  },
  {
    id: "postgres",
    name: "Analytics Postgres",
    category: "Data",
    description: "Read replica reached through a connector in your network.",
    kind: "custom",
    transport: "Private connector",
    url: "connector://data-vpc/analytics-replica",
    auth: "mTLS",
    identity: "Service identity",
    status: "connected",
    tools: [read("query", "Run a read-only SQL query against the replica.")],
    calls24h: 14210,
    p50Ms: 38,
    errorRate: 0.001,
    lastCallMinutesAgo: 0,
    connectedDaysAgo: 43,
  },
  {
    id: "jira",
    name: "Jira",
    category: "Engineering",
    description: "Issues, comments and transitions.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.jira.example/mcp",
    auth: "OAuth 2.1",
    identity: "Service identity",
    status: "connected",
    tools: [
      write("create_issue", "Create an issue in a project."),
      write("add_comment", "Comment on an issue."),
      write("transition_issue", "Move an issue to another status."),
    ],
    calls24h: 842,
    p50Ms: 276,
    errorRate: 0.003,
    lastCallMinutesAgo: 9,
    connectedDaysAgo: 43,
  },
  {
    id: "notion",
    name: "Notion",
    category: "Knowledge",
    description: "Pages and databases.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.notion.example/mcp",
    auth: "OAuth 2.1",
    identity: "Per-user delegation",
    status: "connected",
    tools: [
      read("search", "Search pages the user can access."),
      read("get_page", "Read a page's content."),
      write("create_page", "Create a page under a parent."),
    ],
    calls24h: 318,
    p50Ms: 342,
    errorRate: 0.002,
    lastCallMinutesAgo: 41,
    connectedDaysAgo: 37,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "Knowledge",
    description: "Files and folders with the user's own access.",
    kind: "catalog",
    transport: "Streamable HTTP",
    url: "https://mcp.drive.example/mcp",
    auth: "OAuth 2.1",
    identity: "Per-user delegation",
    status: "connected",
    tools: [
      read("search_files", "Search files the user can access."),
      read("get_file", "Download a file's content."),
      blocked("share_file", "Change who a file is shared with."),
    ],
    calls24h: 264,
    p50Ms: 398,
    errorRate: 0.004,
    lastCallMinutesAgo: 52,
    connectedDaysAgo: 37,
  },
  {
    id: "knowledge-base",
    name: "Help Center",
    category: "Knowledge",
    description: "Internal server that searches published support articles.",
    kind: "custom",
    transport: "Streamable HTTP",
    url: "https://mcp.internal.example/help-center",
    auth: "Service account",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("search", "Search articles by meaning."),
      read("get_article", "Read an article by ID."),
    ],
    calls24h: 16980,
    p50Ms: 96,
    errorRate: 0.001,
    lastCallMinutesAgo: 0,
    connectedDaysAgo: 96,
  },
  {
    id: "internal-erp",
    name: "Finance ERP",
    category: "Finance",
    description: "Invoices, purchase orders and journal entries.",
    kind: "custom",
    transport: "Private connector",
    url: "connector://finance-vpc/erp-gateway",
    auth: "mTLS",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("list_unmatched_invoices", "List invoices with no matching purchase order."),
      read("get_purchase_order", "Read a purchase order."),
      gated("post_journal_entry", "Post a journal entry to the ledger."),
    ],
    calls24h: 1096,
    p50Ms: 144,
    errorRate: 0.002,
    lastCallMinutesAgo: 18,
    connectedDaysAgo: 29,
  },
  {
    id: "identity-provider",
    name: "Identity Provider",
    category: "IT",
    description: "Users, groups and access assignments.",
    kind: "custom",
    transport: "Private connector",
    url: "connector://corp-vpc/identity",
    auth: "mTLS",
    identity: "Service identity",
    status: "degraded",
    tools: [
      read("get_user", "Read a user's profile and manager."),
      read("list_groups", "List groups and their owners."),
      gated("add_to_group", "Add a user to a group."),
      gated("remove_from_group", "Remove a user from a group."),
    ],
    calls24h: 388,
    p50Ms: 1240,
    errorRate: 0.071,
    lastCallMinutesAgo: 4,
    connectedDaysAgo: 22,
  },
  {
    id: "web-research",
    name: "Web Research",
    category: "Research",
    description: "Search and fetch public web pages through an egress proxy.",
    kind: "custom",
    transport: "Streamable HTTP",
    url: "https://mcp.internal.example/web-research",
    auth: "Service account",
    identity: "Service identity",
    status: "connected",
    tools: [
      read("search", "Search the public web."),
      read("fetch", "Fetch and extract a public page."),
    ],
    calls24h: 4410,
    p50Ms: 1120,
    errorRate: 0.012,
    lastCallMinutesAgo: 3,
    connectedDaysAgo: 51,
  },
];

/** Servers offered in the catalog but not connected in the demo workspace. */
export const catalog: Array<{ id: string; name: string; category: string; description: string }> = [
  { id: "linear", name: "Linear", category: "Engineering", description: "Issues and projects." },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Contacts, deals and tickets." },
  {
    id: "confluence",
    name: "Confluence",
    category: "Knowledge",
    description: "Spaces and pages.",
  },
  { id: "sentry", name: "Sentry", category: "Observability", description: "Errors and releases." },
  { id: "bigquery", name: "BigQuery", category: "Data", description: "Warehouse queries." },
  {
    id: "servicenow",
    name: "ServiceNow",
    category: "IT",
    description: "Incidents and change requests.",
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "Support",
    description: "Conversations and help articles.",
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "Engineering",
    description: "Merge requests and pipelines.",
  },
  {
    id: "object-storage",
    name: "Object Storage",
    category: "Data",
    description: "Buckets and objects over an S3-compatible API.",
  },
];

export function getServer(id: string): McpServer | undefined {
  return servers.find((server) => server.id === id);
}

/** Looks up a tool as `server.tool`, for example `stripe.create_refund`. */
export function getTool(reference: string): { server: McpServer; tool: McpTool } | undefined {
  const [serverId, toolName] = reference.split(".");
  const server = getServer(serverId);
  const tool = server?.tools.find((candidate) => candidate.name === toolName);
  return server && tool ? { server, tool } : undefined;
}
