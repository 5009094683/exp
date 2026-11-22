import "server-only";

import type { LeadHandlerEnv } from "./handler";

/** Reads the lead settings from the Node.js environment (Vercel or `next start`). */
export function leadEnvFromProcess(): LeadHandlerEnv {
  return {
    LEADS_WEBHOOK_URL: process.env.LEADS_WEBHOOK_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEADS_TO_EMAIL: process.env.LEADS_TO_EMAIL,
    LEADS_FROM_EMAIL: process.env.LEADS_FROM_EMAIL,
    LEADS_ALLOWED_ORIGINS: process.env.LEADS_ALLOWED_ORIGINS,
  };
}
