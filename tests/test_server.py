import httpx
import pytest
from fastmcp import Client

from bergbahn_mcp import server
from bergbahn_mcp.server import mcp


async def rufe(tool: str, **args):
    async with Client(mcp) as c:
        return (await c.call_tool(tool, args)).structured_content["result"]


async def test_alle_tools_vorhanden_und_nur_lesend():
    async with Client(mcp) as c:
        tools = {t.name: t for t in await c.list_tools()}
    assert set(tools) == {"list_lifts", "get_lift_status", "list_slopes", "get_snow_report", "search_connections"}
    assert all(t.annotations.read_only_hint for t in tools.values())


async def test_offene_lifte_im_gebiet():
    lifte = await rufe("list_lifts", gebiet="sonnenhang", status="offen")
    assert {l["id"] for l in lifte} == {"sh-gondel", "sh-sessel-1", "sh-skilift-kinder"}


async def test_lift_status_mit_grund():
    async with Client(mcp) as c:
        r = await c.call_tool("get_lift_status", {"lift_id": "gb-sessel-eis"})
    assert r.structured_content["grund"] == "Wind"


async def test_unbekannter_lift_gibt_fehler():
    async with Client(mcp) as c:
        with pytest.raises(Exception, match="Unbekannte lift_id"):
            await c.call_tool("get_lift_status", {"lift_id": "gibtsnicht"})


async def test_pisten_filtern():
    pisten = await rufe("list_slopes", schwierigkeit="schwarz")
    assert all(p["status"] == "geschlossen" for p in pisten)


async def test_schneebericht_zaehlt_offene_anlagen():
    async with Client(mcp) as c:
        r = (await c.call_tool("get_snow_report", {"gebiet": "gletscherblick"})).structured_content
    assert (r["lawinenstufe"], r["lifte_offen"], r["pisten_offen"]) == (3, 2, 2)


async def test_verbindungen_werden_vereinfacht(monkeypatch):
    antwort = {"connections": [{
        "from": {"departure": "2026-12-20T08:05:00+0100", "platform": "2"},
        "to": {"arrival": "2026-12-20T08:39:00+0100"},
        "duration": "00d00:34:00", "transfers": 0,
        "sections": [{"journey": {"category": "R", "number": "61"}}, {"walk": {}}],
    }]}

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["from"] == "Interlaken Ost"
        return httpx.Response(200, json=antwort)

    echt = httpx.AsyncClient
    monkeypatch.setattr(server.httpx, "AsyncClient",
                        lambda **kw: echt(transport=httpx.MockTransport(handler), **kw))
    v = await rufe("search_connections", von="Interlaken Ost", nach="Grindelwald")
    assert v == [{"ab": "2026-12-20T08:05:00+0100", "an": "2026-12-20T08:39:00+0100",
                  "dauer": "00d00:34:00", "umstiege": 0, "gleis_ab": "2", "zuege": ["R61"]}]
