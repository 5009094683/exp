import type { Metadata } from "next";
import { AgentWizard } from "@/components/console/views/agent-wizard";

export const metadata: Metadata = { title: "New agent" };

export default function NewAgentPage() {
  return <AgentWizard />;
}
