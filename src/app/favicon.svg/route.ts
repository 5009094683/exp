import { markSvg } from "@/server/brand/images";

export const dynamic = "force-static";

export function GET() {
  return new Response(markSvg(), { headers: { "content-type": "image/svg+xml" } });
}
