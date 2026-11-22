import { handleLeadRequest } from "../src/server/leads/handler";

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/early-access") {
      return handleLeadRequest(request);
    }

    if (pathname.startsWith("/api/")) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // No static asset matched: let the assets binding apply `not_found_handling`.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
