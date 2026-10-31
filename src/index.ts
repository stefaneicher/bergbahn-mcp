// Cloudflare Worker: nimmt MCP-Anfragen unter /mcp entgegen (Streamable HTTP, ohne Sitzungen).

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { datenschutz, ICON_SVG, nutzungsbedingungen, startseite } from "./seiten";
import { createServer } from "./tools";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (pathname === "/mcp") {
      // Pro Anfrage ein frischer Server: einfach und passend zum zustandslosen Worker.
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await createServer().connect(transport);
      const antwort = await transport.handleRequest(request);
      const headers = new Headers(antwort.headers);
      for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
      return new Response(antwort.body, { status: antwort.status, headers });
    }

    if (request.method === "GET") {
      if (pathname === "/") return startseite();
      if (pathname === "/datenschutz" || pathname === "/privacy") return datenschutz();
      if (pathname === "/nutzungsbedingungen" || pathname === "/terms") return nutzungsbedingungen();
      if (pathname === "/icon.svg") {
        return new Response(ICON_SVG, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
      }
    }
    return new Response("Nicht gefunden\n", { status: 404 });
  },
};
