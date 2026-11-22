import type { SiteConfig } from "@/config/site-schema";

type Json = Record<string, unknown>;

/**
 * Organization and WebSite structured data, built only from values that are
 * configured. Unset details are left out instead of being guessed.
 */
export function buildSiteStructuredData(site: SiteConfig): Json {
  const organizationId = `${site.url}/#organization`;
  const sameAs = Object.values(site.social).filter((value): value is string => Boolean(value));

  const organization: Json = {
    "@type": "Organization",
    "@id": organizationId,
    name: site.company.name,
    url: site.url,
    logo: `${site.url}/app-icon-512.png`,
  };
  if (site.company.legalName !== site.company.name) {
    organization.legalName = site.company.legalName;
  }
  if (site.contact.email) organization.email = site.contact.email;
  if (site.contact.phone) organization.telephone = site.contact.phone;
  if (site.company.addressLines.length > 0) {
    organization.address = site.company.addressLines.join(", ");
  }
  if (site.company.foundedYear) organization.foundingDate = String(site.company.foundedYear);
  if (sameAs.length > 0) organization.sameAs = sameAs;

  const website: Json = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.product.name,
    url: site.url,
    description: site.product.description,
    inLanguage: "en",
    publisher: { "@id": organizationId },
  };

  return { "@context": "https://schema.org", "@graph": [organization, website] };
}

/** Serializes structured data for a script tag; `<` is escaped so it cannot end the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
