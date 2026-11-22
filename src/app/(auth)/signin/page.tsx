import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <PageHero title="Sign in" />;
}
