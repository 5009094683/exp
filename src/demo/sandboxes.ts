export type SandboxTemplate = {
  id: string;
  name: string;
  image: string;
  description: string;
  cpu: string;
  memory: string;
  disk: string;
  timeout: string;
  /** Hosts reachable from the sandbox; everything else is blocked. */
  egress: string[];
  usedBy: string[];
  sessions24h: number;
  updatedDaysAgo: number;
};

export const sandboxTemplates: SandboxTemplate[] = [
  {
    id: "python-data",
    name: "Python · data",
    image: "python:3.13-data@sha256:4c1e9a7b",
    description: "Python with pandas, pyarrow and the warehouse clients.",
    cpu: "2 vCPU",
    memory: "4 GB",
    disk: "8 GB",
    timeout: "10 min",
    egress: ["pypi.org", "files.pythonhosted.org"],
    usedBy: ["data-quality-monitor", "invoice-reconciler"],
    sessions24h: 3936,
    updatedDaysAgo: 6,
  },
  {
    id: "node-ci",
    name: "Node.js · CI",
    image: "node:22-ci@sha256:9b07d1f3",
    description: "Node.js with pnpm and a headless browser for test suites.",
    cpu: "4 vCPU",
    memory: "8 GB",
    disk: "16 GB",
    timeout: "20 min",
    egress: ["registry.npmjs.org"],
    usedBy: ["code-review"],
    sessions24h: 1920,
    updatedDaysAgo: 12,
  },
  {
    id: "python-docs",
    name: "Python · documents",
    image: "python:3.13-docs@sha256:e52a08c6",
    description: "Document parsing and OCR with no network access.",
    cpu: "2 vCPU",
    memory: "4 GB",
    disk: "4 GB",
    timeout: "5 min",
    egress: [],
    usedBy: ["contract-analyst"],
    sessions24h: 112,
    updatedDaysAgo: 21,
  },
];

export function getSandboxTemplate(id: string): SandboxTemplate | undefined {
  return sandboxTemplates.find((template) => template.id === id);
}
