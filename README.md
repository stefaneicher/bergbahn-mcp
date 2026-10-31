# Bergbahn-Info – Demo-MCP-Server

Lernprojekt: ein eigener MCP-Server (Model Context Protocol) auf Cloudflare Workers, eingebunden als Plugin bzw. Connector in Claude und ChatGPT.

- **Bahnen, Lifte, Pisten, Schneebericht:** erfundenes Skigebiet «Eigerblick» mit zwei Gebieten (`sonnenhang`, `gletscherblick`), Testdaten in `src/daten.json`.
- **Zugverbindungen:** echte Fahrplandaten über [transport.opendata.ch](https://transport.opendata.ch).

Inoffizielles Demoprojekt, keine Verbindung zu einer echten Bergbahn.

## Tools

| Tool | Eingaben | Antwort |
|---|---|---|
| `list_lifts` | `gebiet`, `status` (optional) | Bahnen und Lifte mit Typ, Status, Betriebszeit |
| `get_lift_status` | `lift_id` | Wartezeit, Grund bei Schliessung |
| `list_slopes` | `gebiet`, `schwierigkeit`, `status` | Pisten mit Status und Präparation |
| `get_snow_report` | `gebiet` | Schneehöhe, Neuschnee, Lawinenstufe, Wetter, offene Anlagen |
| `search_connections` | `von`, `nach`, `datum`, `zeit` | Zugverbindungen |

Alle Tools lesen nur (`readOnlyHint`).

## Lokal

```bash
npm install
npm test           # Tests
npm run dev        # Worker lokal: http://localhost:8787/mcp
npx @modelcontextprotocol/inspector   # zum Ausprobieren im Browser
```

## Veröffentlichen (Cloudflare Workers)

Jeder Push nach `main` testet und veröffentlicht den Worker automatisch (`.github/workflows/deploy.yml`). Einmalig nötig:

1. Cloudflare-Konto (Gratis-Plan genügt). Die Account-ID steht in `wrangler.toml` (kein Geheimnis).
2. API-Token erstellen: My Profile → API Tokens → Vorlage «Edit Cloudflare Workers».
3. Im GitHub-Repo unter Settings → Secrets and variables → Actions das Secret `CLOUDFLARE_API_TOKEN` anlegen.

Danach ist der Server unter `https://bergbahn-mcp.stefan-eicher.workers.dev/mcp` erreichbar.

## Einbinden

**Claude.ai / Claude Desktop:** Einstellungen → Connectors → «Custom Connector» → URL `https://bergbahn-mcp.stefan-eicher.workers.dev/mcp`.

**ChatGPT:** Developer Mode einschalten, dann App/Connector mit derselben URL anlegen.

**Claude Code als Plugin:**

```
/plugin marketplace add stefaneicher/bergbahn-mcp
/plugin install bergbahn-info@bergbahn
```

## Aufbau

```
src/index.ts      Worker: Endpunkt /mcp (Streamable HTTP, zustandslos)
src/tools.ts      die fünf Tools
src/daten.json    Testdaten
test/             Tests (Vitest)
wrangler.toml     Cloudflare-Konfiguration
.claude-plugin/   Plugin und Marketplace für Claude Code
.mcp.json         MCP-Konfiguration des Plugins (URL des Workers)
```
