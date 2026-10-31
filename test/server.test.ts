import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { createServer } from "../src/tools";

async function verbinde(fetchFn?: typeof fetch) {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(fetchFn).connect(a);
  const client = new Client({ name: "test", version: "1" });
  await client.connect(b);
  return client;
}

async function rufe(tool: string, args: Record<string, unknown> = {}, fetchFn?: typeof fetch) {
  const r = (await (await verbinde(fetchFn)).callTool({ name: tool, arguments: args })) as {
    content: { text: string }[];
    isError?: boolean;
  };
  return { daten: r.isError ? r.content[0].text : JSON.parse(r.content[0].text), isError: !!r.isError };
}

describe("Tools", () => {
  it("bietet fünf nur lesende Tools an", async () => {
    const { tools } = await (await verbinde()).listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["get_lift_status", "get_snow_report", "list_lifts", "list_slopes", "search_connections"],
    );
    expect(tools.every((t) => t.annotations?.readOnlyHint && t.annotations.destructiveHint === false)).toBe(true);
    expect(tools.every((t) => t.title)).toBe(true);
  });

  it("filtert offene Lifte im Gebiet", async () => {
    const { daten } = await rufe("list_lifts", { gebiet: "sonnenhang", status: "offen" });
    expect(daten.map((l: { id: string }) => l.id)).toEqual(["sh-gondel", "sh-sessel-1", "sh-skilift-kinder"]);
  });

  it("nennt den Grund einer Schliessung", async () => {
    expect((await rufe("get_lift_status", { lift_id: "gb-sessel-eis" })).daten.grund).toBe("Wind");
  });

  it("meldet unbekannte Lifte als Fehler", async () => {
    const r = await rufe("get_lift_status", { lift_id: "gibtsnicht" });
    expect(r.isError).toBe(true);
    expect(r.daten).toMatch(/Unbekannte lift_id/);
  });

  it("filtert Pisten nach Schwierigkeit", async () => {
    const { daten } = await rufe("list_slopes", { schwierigkeit: "schwarz" });
    expect(daten.every((p: { status: string }) => p.status === "geschlossen")).toBe(true);
  });

  it("zählt im Schneebericht offene Anlagen", async () => {
    const { daten } = await rufe("get_snow_report", { gebiet: "gletscherblick" });
    expect([daten.lawinenstufe, daten.lifte_offen, daten.pisten_offen]).toEqual([3, 2, 2]);
  });

  it("vereinfacht Zugverbindungen", async () => {
    const fakeFetch = (async (url: URL) => {
      expect(url.searchParams.get("from")).toBe("Interlaken Ost");
      return Response.json({
        connections: [{
          from: { departure: "2026-12-20T08:05:00+0100", platform: "2" },
          to: { arrival: "2026-12-20T08:39:00+0100" },
          duration: "00d00:34:00",
          transfers: 0,
          sections: [{ journey: { category: "R", number: "61" } }, { journey: null }],
        }],
      });
    }) as unknown as typeof fetch;
    const { daten } = await rufe("search_connections", { von: "Interlaken Ost", nach: "Grindelwald" }, fakeFetch);
    expect(daten).toEqual([{
      ab: "2026-12-20T08:05:00+0100", an: "2026-12-20T08:39:00+0100",
      dauer: "00d00:34:00", umstiege: 0, gleis_ab: "2", zuege: ["R61"],
    }]);
  });
});

describe("Worker", () => {
  const post = (body: unknown) =>
    worker.fetch(new Request("https://x.dev/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify(body),
    }));

  it("beantwortet initialize unter /mcp", async () => {
    const r = await post({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(((await r.json()) as any).result.serverInfo.name).toBe("Bergbahn-Info");
  });

  it("führt ein Tool über HTTP aus", async () => {
    const r = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_snow_report", arguments: { gebiet: "sonnenhang" } } });
    expect(JSON.parse(((await r.json()) as any).result.content[0].text).lawinenstufe).toBe(2);
  });

  it.each(["/", "/datenschutz", "/privacy", "/nutzungsbedingungen", "/terms", "/icon.svg"])("liefert %s aus", async (pfad) => {
    expect((await worker.fetch(new Request("https://x.dev" + pfad))).status).toBe(200);
  });

  it("gibt 404 für andere Pfade", async () => {
    expect((await worker.fetch(new Request("https://x.dev/foo"))).status).toBe(404);
  });
});
