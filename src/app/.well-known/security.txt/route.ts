import { buildTime } from "@/config/build";
import { site } from "@/config/site";
import { buildSecurityTxt } from "@/lib/security-txt";

export const dynamic = "force-static";

export function GET() {
  return new Response(
    buildSecurityTxt({
      url: site.url,
      securityEmail: site.contact.security,
      builtAt: buildTime,
    }),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
