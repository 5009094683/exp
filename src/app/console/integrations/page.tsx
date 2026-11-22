import type { Metadata } from "next";
import { IntegrationsView } from "@/components/console/views/integrations";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
