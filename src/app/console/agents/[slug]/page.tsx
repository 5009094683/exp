import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/console/views/agent-detail";
import { agents, getAgent } from "@/demo/agents";

export const dynamicParams = false;

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/console/agents/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getAgent(slug)?.name ?? "Agent" };
}

export default async function AgentPage({ params }: PageProps<"/console/agents/[slug]">) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  return <AgentDetailView agent={agent} />;
}
