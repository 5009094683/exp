import { agents } from "@/demo/agents";

export const dynamicParams = false;

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export default function Page() {
  return null;
}
