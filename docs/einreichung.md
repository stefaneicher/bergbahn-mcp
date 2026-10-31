# Einreichung in die öffentlichen Verzeichnisse

Vorbereitete Angaben für Anthropic (Claude Connectors Directory) und OpenAI (ChatGPT App Directory). Die Listing-Texte sind englisch, weil beide Verzeichnisse international sind. Stand: 31.10.2026.

## Gemeinsame Angaben

| Feld | Wert |
|---|---|
| MCP-URL | `https://bergbahn-mcp.stefan-eicher.workers.dev/mcp` |
| Authentifizierung | keine (öffentliche Daten) |
| Website / Dokumentation | https://bergbahn-mcp.stefan-eicher.workers.dev (Quellcode: https://github.com/stefaneicher/bergbahn-mcp) |
| Datenschutz / Privacy | https://bergbahn-mcp.stefan-eicher.workers.dev/privacy |
| Nutzungsbedingungen / Terms | https://bergbahn-mcp.stefan-eicher.workers.dev/terms |
| Support | https://github.com/stefaneicher/bergbahn-mcp/issues |
| Icon | `assets/icon-512.png` (512×512 PNG), Vektor: `assets/icon.svg` |
| Herausgeber | Stefan Eicher (Privatperson), Schweiz |

**Name:** Bergbahn-Info (Demo)

**One-liner (≤200 Zeichen):**
> Demo connector: lifts, slopes and snow report of a fictional Swiss ski area, plus real Swiss train connections from transport.opendata.ch.

**Description (≤2000 Zeichen):**
> Bergbahn-Info is an open-source learning project that shows how a remote MCP server works. It answers questions about the fictional ski area "Eigerblick" with two sectors, Sonnenhang and Gletscherblick: which cable cars and lifts are open, waiting times and closure reasons, open slopes by difficulty, and a snow report with snow depth, fresh snow, avalanche danger level and weather. All ski-area data is clearly labelled demo data and must not be used for real trip planning.
>
> In addition, the connector searches real Swiss public transport connections via the open-data API transport.opendata.ch, so you can ask how to get to the mountain by train.
>
> All five tools are read-only. No login, no personal data, no cookies. Source code (MIT): https://github.com/stefaneicher/bergbahn-mcp

**Kategorien:** Travel, Education (falls vorhanden: Developer tools)

**Beispiel-Prompts (mindestens 3):**
1. «Which lifts are open in the Gletscherblick area right now?» → `list_lifts` (2 offen: Zahnradbahn, Skilift Firn)
2. «What is the snow report for Sonnenhang, and which blue slopes are open?» → `get_snow_report`, `list_slopes`
3. «Why is the Eisfeld chairlift closed?» → `get_lift_status` (Grund: Wind)
4. «Find trains from Bern to Grindelwald tomorrow at 8:00.» → `search_connections`

## Tools und Annotationen (Begründungen)

| Tool | Titel | readOnly | destructive | openWorld | Begründung |
|---|---|---|---|---|---|
| `list_lifts` | Lifte auflisten | true | false | false | liest nur fest eingebaute Demodaten, ändert nichts |
| `get_lift_status` | Liftstatus abfragen | true | false | false | dito |
| `list_slopes` | Pisten auflisten | true | false | false | dito |
| `get_snow_report` | Schneebericht abrufen | true | false | false | dito |
| `search_connections` | Zugverbindungen suchen | true | false | **true** | liest nur, fragt aber den externen öffentlichen Fahrplan transport.opendata.ch ab |

English justification (für das OpenAI-Formular):
> readOnlyHint=true for all tools: they only return data and never create, modify or delete anything. destructiveHint=false: no state changes exist. openWorldHint=false for the four ski-area tools: they read a fixed, bundled demo dataset. openWorldHint=true for search_connections: it queries the external public timetable API transport.opendata.ch.

## Anthropic: Claude Connectors Directory

Voraussetzung: bezahlter Claude-Plan. Portal: https://claude.ai/directory/manage → **Submit new** → **MCP connector**. Doku: https://claude.com/docs/connectors/building/submission

1. **Connection:** MCP-URL einfügen (oder den bestehenden Custom Connector wählen).
2. **Tools:** synchronisieren sich; alle haben Titel und `readOnlyHint`.
3. **Listing:** Name, One-liner, Description, Kategorien, URLs, Icon von oben; Slug `bergbahn-info` (nicht mehr änderbar).
4. **Use cases:** Ski-Infos abfragen, Anreise per Zug planen. Voraussetzungen: keine. Daten: nur lesen.
5. **Company:** Privatperson Stefan Eicher, Website = Startseite.
6. **Authentication:** keine Anmeldung.
7. **Data handling:** Skigebietsdaten eigene (Demo); Zugdaten von einer Drittpartei-API ohne eigene Kontrolle (transport.opendata.ch, Open Data). Keine Gesundheitsdaten, kein gesponserter Inhalt.
8. **Test & launch:** «No account needed. Add the URL as a custom connector and run the example prompts.» Bestätigen, dass alle Tools getestet wurden.
9. **Compliance:** die sieben Bestätigungen lesen und abhaken.
10. **Review and submit.**

Danach prüft Anthropic automatisch und listet den Connector standardmässig als «Community». Rückfragen: mcp-review@anthropic.com.

## OpenAI: ChatGPT App Directory

Voraussetzungen: Owner-Rolle in einer OpenAI-Organisation, verifizierte Organisation/Identität, Projekt mit globaler Datenresidenz (nicht EU). Einreichung im OpenAI Platform Dashboard; Richtlinien: https://developers.openai.com/apps-sdk/app-submission-guidelines

Benötigt (bitte im Formular gegenprüfen):
- Name, Kurz- und Langbeschreibung (Texte oben), Logo (`assets/icon-512.png`)
- Website, Datenschutz, Nutzungsbedingungen, Support (URLs oben)
- Annotationen mit Begründung pro Tool (Tabelle oben)
- Test-Prompts mit erwarteten Antworten (Beispiele oben)
- Screenshots aus ChatGPT, ohne den Prompt im Bild
- Nach der Freigabe separat auf **Publish** klicken

## Risiken bei der Prüfung

- **Fremde API:** Die Anthropic-Richtlinie verlangt eigene oder legitim weitergereichte APIs. transport.opendata.ch ist Open Data, gehört aber nicht uns. Bei Ablehnung: `search_connections` entfernen oder Erlaubnis einholen.
- **Demodaten:** Verzeichnisse wollen nützliche Dienste. Ein Demo-Connector kann als wenig nützlich abgelehnt werden, vor allem bei OpenAI. Die Kennzeichnung als Demo ist Pflicht, damit nichts irreführt.
