import type { Metadata } from "next";
import { BillingSettings } from "@/components/console/views/settings";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return <BillingSettings />;
}
