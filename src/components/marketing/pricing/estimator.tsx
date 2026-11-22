"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { estimate, plans, usageRates } from "@/content/pricing";
import { cn } from "@/lib/cn";

const numberFormat = new Intl.NumberFormat("en-US");
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const largestSelfServe = Math.max(...plans.map((plan) => plan.maxAgents ?? 0));

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-sm text-fg tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-describedby={`${id}-hint`}
        className={cn(
          "mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 outline-offset-4",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md",
          "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white",
        )}
        style={{
          background: `linear-gradient(to right, var(--accent) ${progress}%, var(--surface-3) ${progress}%)`,
        }}
      />
      <p id={`${id}-hint`} className="mt-2 text-xs text-fg-subtle">
        {hint}
      </p>
    </div>
  );
}

function Line({ label, detail, amount }: { label: string; detail: string; amount: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div>
        <dt className="text-sm text-fg">{label}</dt>
        <p className="mt-0.5 text-xs text-fg-subtle">{detail}</p>
      </div>
      <dd className="font-mono text-sm text-fg tabular-nums">{amount}</dd>
    </div>
  );
}

/** Interactive monthly estimate from the plans and rates in `content/pricing.ts`. */
export function PricingEstimator() {
  const [agents, setAgents] = useState(40);
  const [executionsPerAgent, setExecutionsPerAgent] = useState(6000);
  const [sandboxVcpuHours, setSandboxVcpuHours] = useState(500);

  const result = estimate({ agents, executionsPerAgent, sandboxVcpuHours });

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line-strong bg-surface edge-highlight lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8 p-7 md:p-9">
        <Slider
          label="Agents"
          hint="Deployed agent definitions across your workspaces."
          value={agents}
          min={1}
          max={400}
          step={1}
          format={(value) => numberFormat.format(value)}
          onChange={setAgents}
        />
        <Slider
          label="Executions per agent, per month"
          hint="One execution is one run, from trigger to final output."
          value={executionsPerAgent}
          min={500}
          max={30000}
          step={500}
          format={(value) => numberFormat.format(value)}
          onChange={setExecutionsPerAgent}
        />
        <Slider
          label="Sandbox compute, per month"
          hint="vCPU-hours used by code that agents run in sandboxes."
          value={sandboxVcpuHours}
          min={0}
          max={5000}
          step={50}
          format={(value) => `${numberFormat.format(value)} vCPU-hours`}
          onChange={setSandboxVcpuHours}
        />
      </div>

      <div
        className="flex flex-col border-t border-line bg-black/20 p-7 md:p-9 lg:border-t-0 lg:border-l"
        aria-live="polite"
      >
        {result ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-fg-muted">Estimated monthly total</p>
              <Badge tone="accent">{result.plan.name} plan</Badge>
            </div>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-fg tabular-nums">
              {currencyFormat.format(result.total)}
            </p>

            <dl className="mt-6 divide-y divide-line border-y border-line">
              <Line
                label="Agent subscriptions"
                detail={`${numberFormat.format(agents)} × ${currencyFormat.format(result.plan.pricePerAgent ?? 0)}`}
                amount={currencyFormat.format(result.subscription)}
              />
              <Line
                label="Additional executions"
                detail={
                  result.extraExecutions > 0
                    ? `${numberFormat.format(result.extraExecutions)} beyond the ${numberFormat.format(result.includedExecutions)} included`
                    : `Within the ${numberFormat.format(result.includedExecutions)} included`
                }
                amount={currencyFormat.format(result.executionCost)}
              />
              <Line
                label="Sandbox compute"
                detail={`${numberFormat.format(sandboxVcpuHours)} vCPU-hours × $${usageRates.sandboxVcpuHour.toFixed(2)}`}
                amount={currencyFormat.format(result.sandboxCost)}
              />
            </dl>

            <p className="mt-5 text-xs leading-relaxed text-fg-subtle">
              An estimate, not a quote. Model usage is billed by your model provider and is not
              included.
            </p>
            <EarlyAccessButton source="pricing-estimator" className="mt-6 self-start" />
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center">
            <Badge tone="accent" className="w-fit">
              Enterprise
            </Badge>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-fg">
              Let&apos;s size this together
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
              Fleets above {numberFormat.format(largestSelfServe)} agents are priced with an annual
              license that covers volume, deployment and support.
            </p>
            <Button asChild className="mt-7 self-start">
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
