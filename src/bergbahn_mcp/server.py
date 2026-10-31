"""MCP-Server «Bergbahn-Info».

Bahnen, Lifte, Pisten und Schneebericht stammen aus erfundenen Testdaten
(daten.json). Zugverbindungen kommen live von transport.opendata.ch.
"""

import json
import os
from importlib.resources import files
from typing import Literal

import httpx
from fastmcp import FastMCP

DATEN = json.loads(files("bergbahn_mcp").joinpath("daten.json").read_text("utf-8"))
NUR_LESEN = {"readOnlyHint": True, "openWorldHint": False}

Gebiet = Literal["sonnenhang", "gletscherblick"]
Status = Literal["offen", "geschlossen"]

mcp = FastMCP(
    "Bergbahn-Info",
    version="0.1.0",
    instructions=(
        "Auskunft über das erfundene Skigebiet Eigerblick (Gebiete «sonnenhang» und "
        "«gletscherblick»): Bahnen, Lifte, Pisten, Schneebericht. Die Gebietsdaten sind "
        "Demodaten. Zugverbindungen sind echte Fahrplandaten der Schweiz."
    ),
)


@mcp.tool(annotations=NUR_LESEN)
def list_lifts(gebiet: Gebiet | None = None, status: Status | None = None) -> list[dict]:
    """Bahnen und Lifte mit Typ, Status (offen/geschlossen) und Betriebszeit."""
    return [
        {k: l[k] for k in ("id", "gebiet", "name", "typ", "status", "betriebszeit")}
        for l in DATEN["lifte"]
        if (gebiet is None or l["gebiet"] == gebiet) and (status is None or l["status"] == status)
    ]


@mcp.tool(annotations=NUR_LESEN)
def get_lift_status(lift_id: str) -> dict:
    """Detailstatus einer Bahn: Wartezeit in Minuten und Grund bei Schliessung."""
    for l in DATEN["lifte"]:
        if l["id"] == lift_id:
            return {**l, "stand": DATEN["stand"]}
    ids = ", ".join(l["id"] for l in DATEN["lifte"])
    raise ValueError(f"Unbekannte lift_id «{lift_id}». Gültig: {ids}")


@mcp.tool(annotations=NUR_LESEN)
def list_slopes(
    gebiet: Gebiet | None = None,
    schwierigkeit: Literal["blau", "rot", "schwarz"] | None = None,
    status: Status | None = None,
) -> list[dict]:
    """Pisten mit Schwierigkeit, Status und Datum der letzten Präparation."""
    return [
        p
        for p in DATEN["pisten"]
        if (gebiet is None or p["gebiet"] == gebiet)
        and (schwierigkeit is None or p["schwierigkeit"] == schwierigkeit)
        and (status is None or p["status"] == status)
    ]


@mcp.tool(annotations=NUR_LESEN)
def get_snow_report(gebiet: Gebiet) -> dict:
    """Schneebericht: Schneehöhe Berg/Tal, Neuschnee, Lawinenstufe (1–5), Wetter,
    dazu Anzahl offener Lifte und Pisten."""
    g = DATEN["gebiete"][gebiet]
    return {
        "gebiet": g["name"],
        **g["schnee"],
        "lifte_offen": sum(l["gebiet"] == gebiet and l["status"] == "offen" for l in DATEN["lifte"]),
        "pisten_offen": sum(p["gebiet"] == gebiet and p["status"] == "offen" for p in DATEN["pisten"]),
        "stand": DATEN["stand"],
    }


@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": True})
async def search_connections(
    von: str, nach: str, datum: str | None = None, zeit: str | None = None, anzahl: int = 4
) -> list[dict]:
    """Echte Zugverbindungen in der Schweiz (transport.opendata.ch).
    datum im Format JJJJ-MM-TT, zeit als HH:MM; ohne Angabe: jetzt."""
    params = {"from": von, "to": nach, "limit": max(1, min(anzahl, 6))}
    if datum:
        params["date"] = datum
    if zeit:
        params["time"] = zeit
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get("https://transport.opendata.ch/v1/connections", params=params)
        r.raise_for_status()
    return [_verbindung(c) for c in r.json().get("connections", [])]


def _verbindung(c: dict) -> dict:
    return {
        "ab": c["from"]["departure"],
        "an": c["to"]["arrival"],
        "dauer": c.get("duration"),
        "umstiege": c.get("transfers"),
        "gleis_ab": c["from"].get("platform"),
        "zuege": [
            f'{s["journey"]["category"]}{s["journey"].get("number") or ""}'.strip()
            for s in c.get("sections", [])
            if s.get("journey")
        ],
    }


def main() -> None:
    """Start als HTTP-Server (für Claude.ai, ChatGPT) oder lokal per stdio."""
    if os.environ.get("MCP_TRANSPORT", "http") == "stdio":
        mcp.run(transport="stdio")
    else:
        mcp.run(transport="http", host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))


if __name__ == "__main__":
    main()
