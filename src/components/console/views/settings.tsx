"use client";

import { CreditCard, Download, KeyRound, Plus, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { TimeAgo, useNow } from "@/components/console/clock";
import { Avatar, KeyValue, Mono, Panel, Table, Td, Th } from "@/components/console/ui";
import { GateButton, useGate } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { plans, usageRates } from "@/content/pricing";
import { MODEL_PROFILES } from "@/demo/agents";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/demo/format";
import { currentBill } from "@/demo/usage";
import {
  apiKeys,
  identity,
  members,
  modelRouting,
  ROLE_DESCRIPTIONS,
  workspace,
  type MemberRole,
} from "@/demo/workspace";
import { cn } from "@/lib/cn";
import type { AppRoute } from "@/lib/routes";

const sections: Array<{ href: AppRoute; label: string }> = [
  { href: "/console/settings", label: "General" },
  { href: "/console/settings/members", label: "Members" },
  { href: "/console/settings/api-keys", label: "API keys" },
  { href: "/console/settings/security", label: "Security" },
  { href: "/console/settings/billing", label: "Billing" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="flex gap-1 overflow-x-auto border-b border-line">
      {sections.map((section) => {
        const active = pathname === section.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-accent-text text-fg"
                : "border-transparent text-fg-subtle hover:text-fg",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* --- General ----------------------------------------------------------- */

export function GeneralSettings() {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Panel title="Workspace" bodyClassName="space-y-4 p-5">
        <Field id={`${id}-name`} label="Name">
          <Input id={`${id}-name`} defaultValue={workspace.name} />
        </Field>
        <Field
          id={`${id}-slug`}
          label="Workspace ID"
          hint="Used in API requests. Cannot be changed."
        >
          <Input id={`${id}-slug`} defaultValue={workspace.id} readOnly className="font-mono" />
        </Field>
        <Field
          id={`${id}-region`}
          label="Data region"
          hint="Where run data, memory and logs are stored."
        >
          <Select id={`${id}-region`} defaultValue="eu">
            <option value="eu">{workspace.region}</option>
            <option value="us">us-east (Virginia)</option>
            <option value="ap">ap-southeast (Singapore)</option>
          </Select>
        </Field>
        <GateButton gate="generic" source="console:save-settings" size="sm">
          Save changes
        </GateButton>
      </Panel>

      <Panel
        title="Data retention"
        description="How long each kind of data is kept before it is deleted."
        bodyClassName="px-5 py-2"
      >
        <KeyValue
          items={[
            { label: "Run traces", value: workspace.retention.runs },
            { label: "Audit log", value: workspace.retention.audit },
            { label: "Memory", value: workspace.retention.memory },
            { label: "Sandbox filesystems", value: "Destroyed when the task ends" },
          ]}
        />
      </Panel>

      <Panel
        title="Model routing"
        description="Agents ask for a profile. This decides which provider serves it."
        className="xl:col-span-2"
        action={
          <GateButton gate="generic" source="console:model-routing" variant="secondary" size="sm">
            Edit routing
          </GateButton>
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Profile</Th>
              <Th className="hidden md:table-cell">Used for</Th>
              <Th>Primary</Th>
              <Th className="hidden sm:table-cell">Fallback</Th>
              <Th className="text-right">Share of calls · 24h</Th>
            </tr>
          </thead>
          <tbody>
            {modelRouting.map((route) => (
              <tr key={route.profile} className="[&:last-child>td]:border-b-0">
                <Td>
                  <Mono className="text-fg">{route.profile}</Mono>
                </Td>
                <Td className="hidden md:table-cell">
                  {MODEL_PROFILES[route.profile].description}
                </Td>
                <Td className="whitespace-nowrap text-fg">{route.primary}</Td>
                <Td className="hidden whitespace-nowrap sm:table-cell">{route.fallback}</Td>
                <Td className="text-right tabular-nums">{formatPercent(route.share24h, 0)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}

/* --- Members ----------------------------------------------------------- */

const ROLE_TONES: Record<MemberRole, "accent" | "info" | "neutral" | "warning"> = {
  Owner: "accent",
  Admin: "accent",
  Builder: "info",
  Approver: "warning",
  Viewer: "neutral",
};

export function MembersSettings() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel
        title={`${members.length} members`}
        description="Provisioned from the identity provider through SCIM."
        action={
          <GateButton gate="invite-member" size="sm">
            <UserPlus aria-hidden="true" />
            Invite member
          </GateButton>
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th className="hidden md:table-cell">Team</Th>
              <Th className="hidden text-right sm:table-cell">Last active</Th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.email} className="[&:last-child>td]:border-b-0">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} />
                    <div className="min-w-0">
                      <p className="font-medium text-fg">{member.name}</p>
                      <p className="truncate text-xs text-fg-subtle">{member.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={ROLE_TONES[member.role]} size="sm">
                    {member.role}
                  </Badge>
                </Td>
                <Td className="hidden whitespace-nowrap md:table-cell">{member.team}</Td>
                <Td className="hidden text-right whitespace-nowrap sm:table-cell">
                  <TimeAgo minutes={member.lastActiveMinutesAgo} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Roles" bodyClassName="divide-y divide-line">
        {(Object.keys(ROLE_DESCRIPTIONS) as MemberRole[]).map((role) => (
          <div key={role} className="px-4 py-3">
            <Badge tone={ROLE_TONES[role]} size="sm">
              {role}
            </Badge>
            <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* --- API keys ---------------------------------------------------------- */

export function ApiKeysSettings() {
  return (
    <Panel
      title="API keys"
      description="Keys are shown once, when they are created. Only the prefix is kept."
      action={
        <GateButton gate="create-api-key" size="sm">
          <Plus aria-hidden="true" />
          Create API key
        </GateButton>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Key</Th>
            <Th className="hidden lg:table-cell">Scopes</Th>
            <Th className="hidden md:table-cell">Environment</Th>
            <Th className="hidden sm:table-cell">Last used</Th>
            <Th className="text-right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map((key) => (
            <tr key={key.name} className="[&:last-child>td]:border-b-0">
              <Td>
                <p className="flex items-center gap-2 font-medium text-fg">
                  <KeyRound className="size-3.5 text-fg-subtle" aria-hidden="true" />
                  {key.name}
                </p>
                <p className="mt-0.5 text-xs text-fg-subtle">
                  Created by {key.createdBy} · {key.createdDaysAgo} days ago
                </p>
              </Td>
              <Td className="whitespace-nowrap">
                <Mono>{key.prefix}••••••••</Mono>
              </Td>
              <Td className="hidden lg:table-cell">
                <span className="flex flex-wrap gap-1">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} size="sm">
                      {scope}
                    </Badge>
                  ))}
                </span>
              </Td>
              <Td className="hidden whitespace-nowrap md:table-cell">{key.environment}</Td>
              <Td className="hidden whitespace-nowrap sm:table-cell">
                {key.lastUsedMinutesAgo === null ? (
                  <span className="text-warning">Never used</span>
                ) : (
                  <TimeAgo minutes={key.lastUsedMinutesAgo} />
                )}
              </Td>
              <Td className="text-right">
                <GateButton
                  gate="generic"
                  source="console:revoke-api-key"
                  variant="ghost"
                  size="sm"
                >
                  Revoke
                </GateButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}

/* --- Security ---------------------------------------------------------- */

function ToggleRow({
  title,
  description,
  checked,
  source,
}: {
  title: string;
  description: string;
  checked: boolean;
  source: string;
}) {
  const gate = useGate();
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {title}
        </label>
        <p className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={() => gate("generic", source)} />
    </div>
  );
}

export function SecuritySettings() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Panel
        title="Single sign-on"
        action={
          <Badge tone="success" size="sm">
            <ShieldCheck aria-hidden="true" />
            Enforced
          </Badge>
        }
        bodyClassName="divide-y divide-line"
      >
        <div className="px-5 py-2">
          <KeyValue
            items={[
              { label: "Protocol", value: identity.sso.protocol },
              { label: "Identity provider", value: identity.sso.provider },
              {
                label: "Directory sync (SCIM)",
                value: (
                  <>
                    {identity.scim.groups} groups · synced{" "}
                    <TimeAgo minutes={identity.scim.lastSyncMinutesAgo} />
                  </>
                ),
              },
            ]}
          />
        </div>
        <ToggleRow
          title="Require single sign-on"
          description="Members can only sign in through the identity provider."
          checked={identity.sso.enforced}
          source="console:toggle-sso"
        />
        <ToggleRow
          title="Provision members with SCIM"
          description="Add and remove members when they change in the directory."
          checked={identity.scim.enabled}
          source="console:toggle-scim"
        />
      </Panel>

      <div className="space-y-6">
        <Panel title="Sessions" bodyClassName="px-5 py-2">
          <KeyValue
            items={[
              { label: "Idle timeout", value: identity.session.idleTimeout },
              { label: "Maximum lifetime", value: identity.session.maxLifetime },
            ]}
          />
        </Panel>

        <Panel
          title="IP allowlist"
          description="Console and API access is limited to these ranges."
          action={
            <GateButton gate="generic" source="console:ip-allowlist" variant="secondary" size="sm">
              Add range
            </GateButton>
          }
          bodyClassName="divide-y divide-line"
        >
          {identity.ipAllowlist.map((range) => (
            <div key={range} className="flex items-center justify-between gap-4 px-5 py-3">
              <Mono className="text-fg">{range}</Mono>
              <Badge tone="success" size="sm">
                Active
              </Badge>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* --- Billing ----------------------------------------------------------- */

export function BillingSettings() {
  const now = useNow();
  const bill = currentBill(now);
  const plan = plans.find((candidate) => candidate.id === workspace.plan) ?? plans[0];

  // The three billing periods before the current one.
  const invoices = [1, 2, 3].map((monthsAgo) => {
    const today = new Date(now);
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsAgo + 1, 0));
    return {
      id: `INV-${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}`,
      date: end,
      amount: bill.projected * (1 - monthsAgo * 0.07),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-6">
        <Panel
          title="Plan"
          action={
            <GateButton gate="generic" source="console:change-plan" variant="secondary" size="sm">
              Change plan
            </GateButton>
          }
          bodyClassName="p-5"
        >
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight text-fg">{plan.name}</p>
            <p className="text-sm text-fg-subtle">${plan.pricePerAgent} per agent / month</p>
          </div>
          <KeyValue
            className="mt-4"
            items={[
              { label: "Billable agents", value: bill.billableAgents },
              {
                label: "Executions included",
                value: `${formatNumber(plan.includedExecutions ?? 0)} per agent`,
              },
              {
                label: "Additional executions",
                value: `$${usageRates.executionsPerThousand} per 1,000`,
              },
              {
                label: "Sandbox compute",
                value: `$${usageRates.sandboxVcpuHour.toFixed(2)} per vCPU-hour`,
              },
              {
                label: "This period so far",
                value: (
                  <Link href="/console/usage" className="hover:underline">
                    {formatCurrency(bill.total, 0)}
                  </Link>
                ),
              },
            ]}
          />
        </Panel>

        <Panel title="Payment method" bodyClassName="p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-fg-muted">
              <CreditCard className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-fg">Card ending in 4242</p>
              <p className="text-xs text-fg-subtle">Billing contact: marcus.tan@example.com</p>
            </div>
          </div>
          <GateButton
            gate="generic"
            source="console:update-payment"
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Update payment method
          </GateButton>
        </Panel>
      </div>

      <Panel title="Invoices">
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Period ending</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">
                <span className="sr-only">Download</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="[&:last-child>td]:border-b-0">
                <Td>
                  <Mono className="text-fg">{invoice.id}</Mono>
                </Td>
                <Td className="whitespace-nowrap">{formatDate(invoice.date)}</Td>
                <Td>
                  <Badge tone="success" size="sm">
                    Paid
                  </Badge>
                </Td>
                <Td className="text-right tabular-nums">{formatCurrency(invoice.amount, 0)}</Td>
                <Td className="text-right">
                  <GateButton
                    gate="generic"
                    source="console:download-invoice"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${invoice.id}`}
                  >
                    <Download />
                  </GateButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
