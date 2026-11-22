import "server-only";

import { site } from "@/config/site";
import type { DocBlock } from "@/content/docs/types";
import { EARLY_ACCESS_STORAGE_KEY } from "@/lib/leads/storage";
import type { LegalSlug } from "@/lib/routes";

/**
 * Website legal documents, filled in from the site config.
 *
 * These are templates. They describe what this website does as shipped (two
 * forms, one local-storage entry, no analytics) and must be reviewed by a
 * lawyer, and updated whenever the site starts collecting anything else.
 */

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  /** Short label used in navigation between the documents. */
  label: string;
  description: string;
  blocks: DocBlock[];
};

const product = site.product.name;
const { legalName, addressLines, registration } = site.company;
const privacyEmail = site.contact.privacy ?? site.contact.email;

const p = (text: string): DocBlock => ({ type: "p", text });
const list = (...items: string[]): DocBlock => ({ type: "list", items });

function h2(text: string): DocBlock {
  return {
    type: "h2",
    text,
    id: text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  };
}

const reachUs = privacyEmail
  ? `email [${privacyEmail}](mailto:${privacyEmail})`
  : "write to us through the [contact page](/contact)";

/** Who is responsible for the site and how to reach them; lines appear only when configured. */
function contactBlocks(lead: string): DocBlock[] {
  return [
    h2("Contact"),
    p(`${lead} ${reachUs}.`),
    {
      type: "address",
      name: legalName,
      lines: [...addressLines, ...(registration ? [registration] : [])],
    },
  ];
}

const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  label: "Privacy policy",
  description: `How ${legalName} handles personal data on ${site.host} and in the ${product} early-access program.`,
  blocks: [
    p(
      `This policy explains how ${legalName} ("we") handles personal data when you visit ${site.host} or ask to join the ${product} early-access program.`,
    ),
    p(
      `It covers this website. Data that a customer processes with ${product} is handled under the agreement between us and that customer.`,
    ),
    h2("Data we collect"),
    list(
      `**Details you send us.** When you request early access or contact us, we collect what you enter in the form: your name, email address, company and role, the size of your company, how you plan to use ${product} and any message you write.`,
      "**Details of the request.** With each form submission we record the page it was sent from and the country it came from, as reported by our hosting provider.",
      "**Technical data.** Our hosting provider processes your IP address and browser details to deliver the site and keep it secure. We use your IP address to limit repeated form submissions. We do not store it with your request.",
      "**Data kept in your browser.** After you request early access, the site keeps the email address you entered in your browser's local storage, so it can confirm the request on later visits. See the [cookie policy](/legal/cookies).",
    ),
    p(
      "This website does not use advertising or analytics trackers, and we do not buy personal data from third parties.",
    ),
    h2("How we use it"),
    list(
      "To reply to your message or request.",
      "To decide on and manage access to the early-access program, and to send you information about it.",
      "To keep the website secure and to prevent spam and abuse.",
      "To understand which pages lead to requests, using the page recorded with each one.",
    ),
    h2("Legal bases"),
    p(
      "Where data protection law requires a legal basis, we rely on our legitimate interests in answering enquiries, running the early-access program and protecting the site; on steps taken at your request before entering into a contract; and on your consent where we ask for it. You can withdraw consent at any time.",
    ),
    h2("Who we share it with"),
    p(
      "We share personal data only with service providers that help us run the website and handle requests: our hosting provider, and the email and messaging services our team uses to receive form submissions. They process the data on our instructions. We do not sell personal data.",
    ),
    p(
      "We may disclose data when the law requires it, or as part of a merger or sale of the business, in which case this policy continues to apply to it.",
    ),
    h2("How long we keep it"),
    p(
      `We keep the details of your request for as long as we are in contact with you about ${product}. We delete them when they are no longer needed for that purpose, or earlier if you ask us to. Server logs are kept for a short period for security and troubleshooting.`,
    ),
    h2("International transfers"),
    p(
      "Our service providers may process data in countries other than your own. Where the law requires it, we use recognized safeguards for these transfers, such as standard contractual clauses.",
    ),
    h2("Your rights"),
    p(
      "Depending on where you live, you may have the right to see the personal data we hold about you, to have it corrected or deleted, to object to or restrict how we use it, and to receive a copy in a portable format. You can also complain to your data protection authority.",
    ),
    p(`To use these rights, ${reachUs}. We reply within the time the applicable law allows.`),
    h2("Children"),
    p(
      "This website is intended for businesses. It is not directed at children, and we do not knowingly collect their personal data.",
    ),
    h2("Security"),
    p(
      "Access to the personal data described here is limited to the people who need it, and it is sent over encrypted connections. The [security page](/security) describes how the product itself is designed.",
    ),
    h2("Changes to this policy"),
    p("When this policy changes, we post the new version on this page."),
    ...contactBlocks("For questions about this policy or your personal data,"),
  ],
};

const terms: LegalDocument = {
  slug: "terms",
  title: "Terms of Use",
  label: "Terms of use",
  description: `The terms that apply to ${site.host}, including the demo console and the documentation preview.`,
  blocks: [
    p(
      `These terms apply to your use of ${site.host}, including the demo console and the documentation preview. By using the site you agree to them.`,
    ),
    p(
      `If you use ${product} under a separate written agreement with ${legalName}, that agreement governs your use of the product.`,
    ),
    h2("About this site"),
    list(
      `${product} is in early access. The site describes a product that is being built with a small number of teams, so the features, documentation and pricing shown here may change before general availability.`,
      "The demo console shows sample data for illustration. The agents, runs, people and companies in it are fictional, and it is not connected to any real system.",
      "Pricing shown on the site is planned pricing and is not an offer. During early access, pricing is agreed with each team.",
    ),
    h2("Early access requests"),
    p(
      "Requesting early access does not oblige us to provide access, or you to buy anything. If we invite you to the program, your use of the product is covered by a separate agreement.",
    ),
    h2("Acceptable use"),
    p("You agree not to:"),
    list(
      "use the site in a way that breaks the law or infringes the rights of others;",
      "interfere with the site, or try to reach systems or data without authorization;",
      "send automated requests to the forms, or submit false information or another person's details;",
      "copy substantial parts of the site for a competing product or service.",
    ),
    p(
      "If you believe you have found a security vulnerability, please report it as described on the [security page](/security).",
    ),
    h2("Intellectual property"),
    p(
      `The site and its content, including text, design, graphics and code samples, belong to ${legalName} or its licensors. You may view the site, link to it and use the code samples to evaluate ${product}.`,
    ),
    p(
      "Other product and company names mentioned on the site may be trademarks of their owners. They are used to describe compatibility and do not imply endorsement.",
    ),
    h2("Feedback"),
    p(
      `If you send us ideas or suggestions about ${product}, we may use them without restriction and without payment.`,
    ),
    h2("Links to other sites"),
    p(
      "The site may link to websites we do not control. We are not responsible for their content or their practices.",
    ),
    h2("Disclaimers"),
    p(
      "The site is provided as is, for general information. We do not warrant that it is complete, accurate or always available, and nothing on it is a commitment to deliver a feature.",
    ),
    h2("Limitation of liability"),
    p(
      `To the extent the law allows, ${legalName} is not liable for indirect or consequential losses arising from your use of the site, or for losses that result from relying on its content. Nothing in these terms limits liability that cannot be limited by law.`,
    ),
    h2("Governing law"),
    p(
      site.legal.jurisdiction
        ? `These terms are governed by the laws of ${site.legal.jurisdiction}, and its courts have jurisdiction over any dispute, unless mandatory law where you live provides otherwise.`
        : `These terms are governed by the laws of the place where ${legalName} is established, unless mandatory law where you live provides otherwise.`,
    ),
    h2("Changes to these terms"),
    p("We may update these terms. The version on this page applies from the time it is posted."),
    ...contactBlocks("For questions about these terms,"),
  ],
};

const cookies: LegalDocument = {
  slug: "cookies",
  title: "Cookie Policy",
  label: "Cookie policy",
  description: `What ${site.host} stores in your browser, and how to remove it.`,
  blocks: [
    p(
      `This page explains what ${site.host} stores in your browser. In short, the site sets no cookies of its own and uses no advertising or analytics trackers.`,
    ),
    h2("What we store"),
    {
      type: "table",
      head: ["Name", "Type", "Purpose", "Kept for"],
      rows: [
        [
          `\`${EARLY_ACCESS_STORAGE_KEY}\``,
          "Local storage",
          "Holds the email address you entered when you requested early access, so the site can confirm your request instead of asking again. It stays in your browser.",
          "Until you clear the site's data",
        ],
      ],
    },
    h2("Cookies from our hosting provider"),
    p(
      "The network that delivers this site may set a short-lived, strictly necessary cookie to tell people from automated traffic and to protect the site from abuse. It is not used to follow you across other websites.",
    ),
    h2("What we do not use"),
    list(
      "Advertising or retargeting cookies.",
      "Third-party analytics or session recording.",
      "Social media trackers.",
    ),
    h2("Removing stored data"),
    p(
      "You can remove what this site has stored at any time in your browser's settings, usually under privacy or site data. The site keeps working if you do. The early-access form is shown again in place of the confirmation.",
    ),
    h2("Changes to this policy"),
    p(
      "If we start to use cookies that need your consent, we will ask for it first and update this page.",
    ),
    ...contactBlocks("For questions about this policy,"),
  ],
};

export const legalDocuments: LegalDocument[] = [privacy, terms, cookies];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return legalDocuments.find((document) => document.slug === slug);
}
