export async function handleLeadRequest(request: Request): Promise<Response> {
  return Response.json({ ok: true, method: request.method });
}
