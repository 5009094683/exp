import { handleLeadRequest } from "@/server/leads/handler";

export async function POST(request: Request) {
  return handleLeadRequest(request);
}
