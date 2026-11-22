import type { ReactNode } from "react";
import { PageHeader } from "@/components/console/ui";
import { SettingsNav } from "@/components/console/views/settings";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration, people, keys, sign-in and billing."
      />
      <SettingsNav />
      {children}
    </>
  );
}
