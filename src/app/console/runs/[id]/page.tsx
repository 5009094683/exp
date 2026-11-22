import { runs } from "@/demo/runs";

export const dynamicParams = false;

export function generateStaticParams() {
  return runs.map((run) => ({ id: run.id }));
}

export default function Page() {
  return null;
}
