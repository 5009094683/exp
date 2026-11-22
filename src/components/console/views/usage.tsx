"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { BarChart } from "@/components/console/charts";
import { useNow } from "@/components/console/clock";
import { PageHeader, Panel, Stat, Table, Td, Th } from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDay,
  formatNumber,
  formatPercent,
} from "@/demo/format";
import { billingPeriod, currentBill, dailyUsage, usageByAgent } from "@/demo/usage";

export function UsageView() {
  const now = useNow();
  const period = billingPeriod(now);
  const bill = currentBill(now);
  const days = dailyUsage(now, 30);
  const byAgent = usageByAgent(now);
  const totalExecutions = byAgent.reduce((sum, item) => sum + item.executions, 0);
  const modelSpend = byAgent.reduce((sum, item) => sum + item.modelCost, 0);

  const chart = days.map((day, index) => ({
    key: day.date.toISOString(),
    label: formatDay(day.date),
    value: day.executions,
    highlight: day.failed,
    title: `${formatDay(day.date)} · ${formatNumber(day.executions)} executions, ${formatNumber(day.failed)} failed`,
    showLabel: index % 5 === 2,
  }));

  return (
    <>
      <PageHeader
        title="Usage"
        description={`Billing period ${formatDay(period.start)} to ${formatDate(period.end)}. Day ${period.daysElapsed} of ${period.daysInMonth}.`}
        badge={<Badge tone="accent">{bill.planName} plan</Badge>}
        actions={
          <GateButton gate="generic" source="console:export-usage" variant="secondary" size="sm">
            <Download aria-hidden="true" />
            Export usage
          </GateButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Billable agents"
          value={bill.billableAgents}
          hint="Deployed agent definitions"
        />
        <Stat
          label="Executions this period"
          value={formatCompact(bill.executions)}
          hint={`${formatCompact(bill.includedExecutions)} included in the plan`}
        />
        <Stat
          label="Sandbox compute"
          value={`${formatNumber(Math.round(bill.sandboxVcpuHours))} h`}
          hint="vCPU-hours this period"
        />
        <Stat
          label="Bill so far"
          value={formatCurrency(bill.total, 0)}
          hint={`Projected ${formatCurrency(bill.projected, 0)} this period`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel
          title="Executions per day"
          description="Last 30 days. Failed executions are shown in red."
          bodyClassName="p-4 pt-5"
        >
          <BarChart data={chart} formatValue={formatCompact} />
        </Panel>

        <Panel
          title="Bill so far"
          action={
            <GateButton gate="generic" source="console:change-plan" variant="ghost" size="sm">
              Change plan
            </GateButton>
          }
          bodyClassName="p-4"
        >
          <dl className="divide-y divide-line">
            {bill.lines.map((line) => (
              <div
                key={line.label}
                className="flex items-start justify-between gap-6 py-3 first:pt-0"
              >
                <div className="min-w-0">
                  <dt className="text-[13px] text-fg">{line.label}</dt>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{line.detail}</p>
                </div>
                <dd className="shrink-0 font-mono text-[13px] text-fg tabular-nums">
                  {formatCurrency(line.amount, 0)}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-6 pt-3">
              <dt className="text-sm font-medium text-fg">Total so far</dt>
              <dd className="font-mono text-base font-semibold text-fg tabular-nums">
                {formatCurrency(bill.total, 0)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3 text-xs leading-relaxed text-fg-muted">
            Model usage is billed by your model providers and is not part of this bill. Agents spent
            about {formatCurrency(modelSpend, 0)} with them this period.{" "}
            <Link href="/pricing" className="text-fg underline underline-offset-4">
              How pricing works
            </Link>
          </p>
        </Panel>
      </div>

      <Panel title="Usage by agent" description="Month to date">
        <Table>
          <thead>
            <tr>
              <Th>Agent</Th>
              <Th className="text-right">Executions</Th>
              <Th className="hidden text-right sm:table-cell">Share</Th>
              <Th className="hidden text-right md:table-cell">Tokens</Th>
              <Th className="hidden text-right lg:table-cell">Sandbox vCPU-hours</Th>
              <Th className="text-right">Model spend</Th>
            </tr>
          </thead>
          <tbody>
            {byAgent.map((item) => (
              <tr key={item.slug} className="[&:last-child>td]:border-b-0">
                <Td>
                  <Link
                    href={`/console/agents/${item.slug}`}
                    className="font-medium text-fg hover:underline"
                  >
                    {item.name}
                  </Link>
                </Td>
                <Td className="text-right text-fg tabular-nums">{formatNumber(item.executions)}</Td>
                <Td className="hidden text-right tabular-nums sm:table-cell">
                  {formatPercent(item.executions / Math.max(1, totalExecutions))}
                </Td>
                <Td className="hidden text-right tabular-nums md:table-cell">
                  {formatCompact(item.tokens)}
                </Td>
                <Td className="hidden text-right tabular-nums lg:table-cell">
                  {item.sandboxVcpuHours >= 1
                    ? formatNumber(Math.round(item.sandboxVcpuHours))
                    : item.sandboxVcpuHours > 0
                      ? "< 1"
                      : "—"}
                </Td>
                <Td className="text-right tabular-nums">{formatCurrency(item.modelCost, 0)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
