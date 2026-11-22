import type { Metadata } from "next";
import { ApiKeysSettings } from "@/components/console/views/settings";

export const metadata: Metadata = { title: "API keys" };

export default function ApiKeysPage() {
  return <ApiKeysSettings />;
}
