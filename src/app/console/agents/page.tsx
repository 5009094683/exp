import type { Metadata } from "next";
import { AgentsListView } from "@/components/console/views/agents-list";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return <AgentsListView />;
}
