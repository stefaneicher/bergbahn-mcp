# Bergbahn-Info – Demo-MCP-Server

Lernprojekt: ein eigener MCP-Server (Model Context Protocol), der als Plugin bzw. Connector in Claude und ChatGPT eingebunden wird.

- **Bahnen, Lifte, Pisten, Schneebericht:** erfundenes Skigebiet «Eigerblick» mit zwei Gebieten (`sonnenhang`, `gletscherblick`), Testdaten in `src/bergbahn_mcp/daten.json`.
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

## Lokal starten

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
pytest                      # Tests
bergbahn-mcp                # HTTP-Server auf http://localhost:8000/mcp
npx @modelcontextprotocol/inspector   # zum Ausprobieren im Browser
```

## Einbinden

**Claude Code als Plugin** (läuft lokal über `uvx`, kein Hosting nötig):

```
/plugin marketplace add stefaneicher/bergbahn-mcp
/plugin install bergbahn-info@bergbahn
```

**Claude.ai / Claude Desktop:** Server hosten (siehe unten), dann Einstellungen → Connectors → «Custom Connector» → `https://<host>/mcp`.

**ChatGPT:** Developer Mode einschalten, dann App/Connector mit der URL `https://<host>/mcp` anlegen.

## Hosten

Das `Dockerfile` läuft auf jedem Container-Dienst (z. B. Render, Fly.io). Der Dienst setzt `PORT`; der Server hört auf `/mcp`.

## Aufbau

```
src/bergbahn_mcp/server.py   Tools (FastMCP)
src/bergbahn_mcp/daten.json  Testdaten
tests/                       Tests (in-memory, ohne Netz)
.claude-plugin/              Plugin und Marketplace für Claude Code
.mcp.json                    MCP-Konfiguration des Plugins
```
