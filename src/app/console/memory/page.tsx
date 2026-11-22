import type { Metadata } from "next";
import { MemoryView } from "@/components/console/views/memory";

export const metadata: Metadata = { title: "Memory" };

export default function MemoryPage() {
  return <MemoryView />;
}
