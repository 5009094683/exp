import type { Metadata } from "next";
import { UsageView } from "@/components/console/views/usage";

export const metadata: Metadata = { title: "Usage" };

export default function UsagePage() {
  return <UsageView />;
}
