import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunDetailView } from "@/components/console/views/run-detail";
import { getRun, runs } from "@/demo/runs";

export const dynamicParams = false;

export function generateStaticParams() {
  return runs.map((run) => ({ id: run.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/console/runs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const run = getRun(id);
  return { title: run ? `${run.agentName} · ${run.id}` : "Run" };
}

export default async function RunPage({ params }: PageProps<"/console/runs/[id]">) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  return <RunDetailView run={run} />;
}
