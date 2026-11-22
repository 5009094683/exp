import type { Metadata } from "next";
import { OverviewView } from "@/components/console/views/overview";

export const metadata: Metadata = { title: "Overview" };

export default function ConsoleOverviewPage() {
  return <OverviewView />;
}
