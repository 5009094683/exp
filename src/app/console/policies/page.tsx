import type { Metadata } from "next";
import { PoliciesView } from "@/components/console/views/policies";

export const metadata: Metadata = { title: "Policies" };

export default function PoliciesPage() {
  return <PoliciesView />;
}
