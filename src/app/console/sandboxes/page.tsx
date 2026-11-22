import type { Metadata } from "next";
import { SandboxesView } from "@/components/console/views/sandboxes";

export const metadata: Metadata = { title: "Sandboxes" };

export default function SandboxesPage() {
  return <SandboxesView />;
}
