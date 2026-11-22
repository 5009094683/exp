import type { Metadata } from "next";
import { Suspense } from "react";
import { RunsListView } from "@/components/console/views/runs-list";

export const metadata: Metadata = { title: "Runs" };

export default function RunsPage() {
  return (
    // The list reads `?status=` from the URL, which is only known in the browser.
    <Suspense>
      <RunsListView />
    </Suspense>
  );
}
