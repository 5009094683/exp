import { capabilities } from "@/content/capabilities";
import { docsHref, docsPages } from "@/content/docs/nav";
import { solutions } from "@/content/solutions";
import { agents } from "@/demo/agents";
import { runs } from "@/demo/runs";

/**
 * Every page the site serves, grouped by how it should be treated. The
 * sitemap is built from the indexable groups, and the tests use the full list
 * to check that links point somewhere real.
 */

export const marketingRoutes: string[] = [
  "/",
  "/platform",
  ...capabilities.map((capability) => `/platform/${capability.slug}`),
  ...solutions.map((solution) => `/solutions/${solution.slug}`),
  "/pricing",
  "/security",
  "/company",
  "/contact",
  "/early-access",
];

export const docsRoutes: string[] = docsPages.map((page) => docsHref(page.slug));

export const legalRoutes: string[] = ["/legal/privacy", "/legal/terms", "/legal/cookies"];

/** Pages that exist but are kept out of search results and the sitemap. */
export const unlistedRoutes: string[] = [
  "/signin",
  "/console",
  "/console/agents",
  "/console/agents/new",
  ...agents.map((agent) => `/console/agents/${agent.slug}`),
  "/console/runs",
  ...runs.map((run) => `/console/runs/${run.id}`),
  "/console/memory",
  "/console/integrations",
  "/console/sandboxes",
  "/console/policies",
  "/console/audit",
  "/console/usage",
  "/console/settings",
  "/console/settings/members",
  "/console/settings/api-keys",
  "/console/settings/security",
  "/console/settings/billing",
];

export const indexableRoutes: string[] = [...marketingRoutes, ...docsRoutes, ...legalRoutes];

export const allRoutes: string[] = [...indexableRoutes, ...unlistedRoutes];
