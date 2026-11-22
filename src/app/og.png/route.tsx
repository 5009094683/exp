import { socialCard } from "@/server/brand/images";

export const dynamic = "force-static";

export function GET() {
  return socialCard();
}
