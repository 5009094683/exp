import type { Metadata } from "next";
import { Suspense } from "react";
import { RunsListFromUrl, RunsListView } from "@/components/console/views/runs-list";

export const metadata: Metadata = { title: "Runs" };

export default function RunsPage() {
  return (
    <Suspense fallback={<RunsListView />}>
      <RunsListFromUrl />
    </Suspense>
  );
}
