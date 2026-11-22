import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { FaqAccordion } from "./faq-accordion";
import { Container, Section, SectionHeading } from "./layout";

export type FaqItem = { question: string; answer: string };

/** FAQ block with matching FAQPage structured data. */
export function FaqSection({
  items,
  title = "Frequently asked questions",
  description,
  tone,
}: {
  items: FaqItem[];
  title?: string;
  description?: ReactNode;
  tone?: "default" | "subtle";
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <Section tone={tone} divider>
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <SectionHeading eyebrow="FAQ" title={title} description={description} className="reveal" />
        <FaqAccordion items={items} />
      </Container>
      <JsonLd data={structuredData} />
    </Section>
  );
}
