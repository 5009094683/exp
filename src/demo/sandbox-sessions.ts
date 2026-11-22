import { runs } from "./runs";

export type SandboxSession = {
  id: string;
  template: string;
  agentSlug: string;
  agentName: string;
  runId?: string;
  status: "running" | "completed" | "failed" | "terminated";
  startedMinutesAgo: number;
  durationMs: number;
  command: string;
  logs: string[];
  exitCode?: number;
  cpuSeconds: number;
  peakMemoryMb: number;
  egress: Array<{ host: string; allowed: boolean }>;
};

/** Sessions taken from the sample runs, so every sandbox links back to its run. */
const fromRuns: SandboxSession[] = runs.flatMap((run) =>
  run.steps
    .filter((step) => step.sandbox && step.status !== "pending")
    .map((step): SandboxSession => {
      const sandbox = step.sandbox!;
      return {
        id: sandbox.id,
        template: sandbox.template,
        agentSlug: run.agentSlug,
        agentName: run.agentName,
        runId: run.id,
        status:
          step.status === "running" ? "running" : step.status === "error" ? "failed" : "completed",
        startedMinutesAgo: Math.max(0, run.startedMinutesAgo - step.startMs / 60_000),
        durationMs: step.durationMs,
        command: sandbox.command,
        logs: sandbox.logs,
        exitCode: sandbox.exitCode,
        cpuSeconds: step.status === "running" ? sandbox.cpuSeconds * 0.5 : sandbox.cpuSeconds,
        peakMemoryMb: sandbox.peakMemoryMb,
        egress: sandbox.egress,
      };
    }),
);

/** One session that hit its time limit, to show how limits are enforced. */
const terminated: SandboxSession = {
  id: "sbx_7t2k9m4x1q",
  template: "python-data",
  agentSlug: "data-quality-monitor",
  agentName: "Data Quality Monitor",
  status: "terminated",
  startedMinutesAgo: 268,
  durationMs: 600_000,
  command: "python checks/anomaly.py --tables all --deep",
  logs: [
    "$ python checks/anomaly.py --tables all --deep",
    "loading 42 table(s)",
    "events_raw: scanning 1.2B rows",
    "events_raw: 38% ...",
    "events_raw: 71% ...",
    "killed: wall-clock limit of 10 min reached",
  ],
  exitCode: 137,
  cpuSeconds: 1184,
  peakMemoryMb: 3890,
  egress: [{ host: "paste.example", allowed: false }],
};

export const sandboxSessions: SandboxSession[] = [...fromRuns, terminated].sort(
  (a, b) => a.startedMinutesAgo - b.startedMinutesAgo,
);
