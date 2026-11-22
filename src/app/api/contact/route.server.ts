import { site } from "@/config/site";
import { leadEnvFromProcess } from "@/server/leads/env";
import { handleLeadRequest } from "@/server/leads/handler";

// This file only exists in the server build target (see next.config.ts). The
// static target answers the same path from worker/index.ts.
export async function POST(request: Request) {
  return handleLeadRequest(request, {
    kind: "contact",
    env: leadEnvFromProcess(),
    siteName: site.product.name,
  });
}
