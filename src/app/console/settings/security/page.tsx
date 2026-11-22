import type { Metadata } from "next";
import { SecuritySettings } from "@/components/console/views/settings";

export const metadata: Metadata = { title: "Security settings" };

export default function SecuritySettingsPage() {
  return <SecuritySettings />;
}
