// Die fünf Tools des MCP-Servers «Bergbahn-Info».
// Bahnen, Lifte, Pisten und Schneebericht sind erfundene Testdaten (daten.json).
// Zugverbindungen kommen live von transport.opendata.ch.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import daten from "./daten.json";

type Gebiet = keyof typeof daten.gebiete;
const gebiet = z.enum(["sonnenhang", "gletscherblick"]);
const status = z.enum(["offen", "geschlossen"]);
// Alle Tools lesen nur. Die Hinweise steuern, ob Claude/ChatGPT vor dem Aufruf nachfragen.
const NUR_LESEN = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const DEMO = " Demodaten des erfundenen Skigebiets Eigerblick.";

/** Antwort als JSON-Text, so wie es Claude und ChatGPT erwarten. */
const json = (wert: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(wert, null, 2) }] });
const fehler = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true });

export function createServer(fetchFn: typeof fetch = fetch): McpServer {
  const server = new McpServer(
    { name: "Bergbahn-Info", version: "0.3.0" },
    {
      instructions:
        "Auskunft über das erfundene Skigebiet Eigerblick (Gebiete «sonnenhang» und «gletscherblick»): " +
        "Bahnen, Lifte, Pisten, Schneebericht. Die Gebietsdaten sind Demodaten. " +
        "Zugverbindungen sind echte Fahrplandaten der Schweiz.",
    },
  );

  server.registerTool(
    "list_lifts",
    {
      title: "Lifte auflisten",
      description: "Bahnen und Lifte mit Typ, Status (offen/geschlossen) und Betriebszeit." + DEMO,
      inputSchema: { gebiet: gebiet.optional(), status: status.optional() },
      annotations: NUR_LESEN,
    },
    async (a) =>
      json(
        daten.lifte
          .filter((l) => (!a.gebiet || l.gebiet === a.gebiet) && (!a.status || l.status === a.status))
          .map(({ id, gebiet, name, typ, status, betriebszeit }) => ({ id, gebiet, name, typ, status, betriebszeit })),
      ),
  );

  server.registerTool(
    "get_lift_status",
    {
      title: "Liftstatus abfragen",
      description: "Detailstatus einer Bahn: Wartezeit in Minuten und Grund bei Schliessung." + DEMO,
      inputSchema: { lift_id: z.string().describe("z. B. sh-gondel, aus list_lifts") },
      annotations: NUR_LESEN,
    },
    async ({ lift_id }) => {
      const lift = daten.lifte.find((l) => l.id === lift_id);
      if (!lift) return fehler(`Unbekannte lift_id «${lift_id}». Gültig: ${daten.lifte.map((l) => l.id).join(", ")}`);
      return json({ ...lift, stand: daten.stand });
    },
  );

  server.registerTool(
    "list_slopes",
    {
      title: "Pisten auflisten",
      description: "Pisten mit Schwierigkeit, Status und Datum der letzten Präparation." + DEMO,
      inputSchema: {
        gebiet: gebiet.optional(),
        schwierigkeit: z.enum(["blau", "rot", "schwarz"]).optional(),
        status: status.optional(),
      },
      annotations: NUR_LESEN,
    },
    async (a) =>
      json(
        daten.pisten.filter(
          (p) =>
            (!a.gebiet || p.gebiet === a.gebiet) &&
            (!a.schwierigkeit || p.schwierigkeit === a.schwierigkeit) &&
            (!a.status || p.status === a.status),
        ),
      ),
  );

  server.registerTool(
    "get_snow_report",
    {
      title: "Schneebericht abrufen",
      description:
        "Schneebericht: Schneehöhe Berg/Tal, Neuschnee, Lawinenstufe (1–5), Wetter, dazu Anzahl offener Lifte und Pisten." +
        DEMO,
      inputSchema: { gebiet },
      annotations: NUR_LESEN,
    },
    async ({ gebiet }) => {
      const g = daten.gebiete[gebiet as Gebiet];
      const offen = (liste: { gebiet: string; status: string }[]) =>
        liste.filter((x) => x.gebiet === gebiet && x.status === "offen").length;
      return json({
        gebiet: g.name,
        ...g.schnee,
        lifte_offen: offen(daten.lifte),
        pisten_offen: offen(daten.pisten),
        stand: daten.stand,
      });
    },
  );

  server.registerTool(
    "search_connections",
    {
      title: "Zugverbindungen suchen",
      description: "Echte Zugverbindungen in der Schweiz (transport.opendata.ch). Ohne Datum/Zeit: ab jetzt.",
      inputSchema: {
        von: z.string().describe("Abfahrtsort, z. B. Interlaken Ost"),
        nach: z.string().describe("Zielort, z. B. Grindelwald"),
        datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("JJJJ-MM-TT"),
        zeit: z.string().regex(/^\d{2}:\d{2}$/).optional().describe("HH:MM"),
        anzahl: z.number().int().min(1).max(6).default(4),
      },
      annotations: { ...NUR_LESEN, openWorldHint: true },
    },
    async ({ von, nach, datum, zeit, anzahl }) => {
      const url = new URL("https://transport.opendata.ch/v1/connections");
      url.searchParams.set("from", von);
      url.searchParams.set("to", nach);
      url.searchParams.set("limit", String(anzahl));
      if (datum) url.searchParams.set("date", datum);
      if (zeit) url.searchParams.set("time", zeit);
      const r = await fetchFn(url);
      if (!r.ok) return fehler(`Fahrplan nicht erreichbar (HTTP ${r.status}).`);
      const { connections = [] } = (await r.json()) as { connections?: Verbindung[] };
      return json(connections.map(vereinfache));
    },
  );

  return server;
}

interface Verbindung {
  from: { departure: string; platform?: string | null };
  to: { arrival: string };
  duration?: string;
  transfers?: number;
  sections?: { journey?: { category: string; number?: string | null } | null }[];
}

function vereinfache(c: Verbindung) {
  return {
    ab: c.from.departure,
    an: c.to.arrival,
    dauer: c.duration,
    umstiege: c.transfers,
    gleis_ab: c.from.platform ?? null,
    zuege: (c.sections ?? []).flatMap((s) => (s.journey ? [`${s.journey.category}${s.journey.number ?? ""}`] : [])),
  };
}
