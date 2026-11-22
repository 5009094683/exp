import { createServer } from "node:http";
import { WEBHOOK_PORT } from "../../playwright.config";

/**
 * Starts a local receiver that stands in for the leads webhook, so tests can
 * assert what the site forwards. `GET /received` returns every payload so far.
 */
export default async function globalSetup() {
  const received: unknown[] = [];

  const server = createServer((request, response) => {
    if (request.method === "POST" && request.url === "/hook") {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        try {
          received.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch {
          received.push(null);
        }
        response.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
      });
      return;
    }

    if (request.method === "GET" && request.url === "/received") {
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(received));
      return;
    }

    response.writeHead(404).end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(WEBHOOK_PORT, "127.0.0.1", resolve);
  });

  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
}
