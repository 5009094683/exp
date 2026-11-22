"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicSite } from "@/config/site-schema";

const SiteContext = createContext<PublicSite | null>(null);

export function SiteProvider({ value, children }: { value: PublicSite; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/** Product, company and contact details for client components. */
export function useSite(): PublicSite {
  const site = useContext(SiteContext);
  if (!site) throw new Error("useSite must be used inside <SiteProvider>.");
  return site;
}
