import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { Container } from "@/components/marketing/layout";
import { docsNav } from "@/content/docs/nav";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-10 lg:py-14">
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <div>
          <DocsSidebar groups={docsNav} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
