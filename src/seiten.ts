// Öffentliche Seiten des Workers: Startseite, Datenschutz, Nutzungsbedingungen, Icon.
// Die Verzeichnisse von Anthropic und OpenAI verlangen dafür öffentliche URLs.

const REPO = "https://github.com/stefaneicher/bergbahn-mcp";
const KONTAKT = `${REPO}/issues`;
const STAND = "31.10.2026";

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#1d4ed8"/>
<path d="M40 420 L190 190 L250 270 L330 140 L472 420 Z" fill="#ffffff"/>
<path d="M190 190 L222 239 L200 232 L178 250 L160 236 Z M330 140 L370 222 L345 210 L322 230 L300 206 Z" fill="#bfdbfe"/>
<path d="M60 120 L452 70" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
<path d="M300 88 L300 112" stroke="#ffffff" stroke-width="6"/>
<rect x="268" y="110" width="64" height="54" rx="10" fill="#dc2626"/>
<rect x="278" y="120" width="44" height="20" rx="4" fill="#fecaca"/>
</svg>`;

function seite(titel: string, inhalt: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel} – Bergbahn-Info</title><link rel="icon" href="/icon.svg">
<style>body{font:16px/1.55 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1.5rem 1rem;color:#111;background:#fff}
h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:1.6rem}code{background:#f1f5f9;padding:.1rem .3rem;border-radius:4px}
a{color:#1d4ed8}footer{margin-top:2.5rem;font-size:.85rem;color:#555}
@media (prefers-color-scheme:dark){body{background:#0f172a;color:#e2e8f0}code{background:#1e293b}a{color:#93c5fd}footer{color:#94a3b8}}</style>
</head><body>${inhalt}<footer><a href="/">Start</a> · <a href="/datenschutz">Datenschutz / Privacy</a> ·
<a href="/nutzungsbedingungen">Nutzungsbedingungen / Terms</a> · <a href="${REPO}">GitHub</a></footer></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const startseite = () =>
  seite("Start", `<h1>Bergbahn-Info</h1>
<p>Demo-MCP-Server (Model Context Protocol) für Claude und ChatGPT: Bahnen, Lifte, Pisten und Schneebericht des
<strong>erfundenen</strong> Skigebiets «Eigerblick», dazu echte Zugverbindungen der Schweiz über
<a href="https://transport.opendata.ch">transport.opendata.ch</a>. Inoffizielles Lernprojekt ohne Verbindung zu einer echten Bergbahn.</p>
<h2>Einbinden</h2>
<p>MCP-Endpunkt: <code>https://bergbahn-mcp.stefan-eicher.workers.dev/mcp</code> (ohne Login).</p>
<ul><li>Claude: Einstellungen → Connectors → Custom Connector → URL eintragen.</li>
<li>ChatGPT: Developer Mode einschalten → App/Connector mit der URL anlegen.</li></ul>
<h2>Beispiele</h2>
<ul><li>«Welche Lifte sind im Gebiet Gletscherblick offen?»</li>
<li>«Wie ist der Schneebericht am Sonnenhang, und welche blauen Pisten sind offen?»</li>
<li>«Zeig mir Züge von Bern nach Grindelwald morgen um 8 Uhr.»</li></ul>
<p>Dokumentation und Quellcode: <a href="${REPO}">${REPO}</a></p>`);

export const datenschutz = () =>
  seite("Datenschutz", `<h1>Datenschutzerklärung</h1>
<p>Stand: ${STAND}. Gilt für den MCP-Server «Bergbahn-Info» unter <code>bergbahn-mcp.stefan-eicher.workers.dev</code>.</p>
<h2>Verantwortlich</h2><p>Stefan Eicher, Schweiz. Kontakt: <a href="${KONTAKT}">GitHub Issues</a>.</p>
<h2>Welche Daten verarbeitet werden</h2>
<p>Der Server erhält nur die Parameter der aufgerufenen Tools (z. B. Gebiet, Liftnummer, Abfahrts- und Zielort).
Er erhält keine Gesprächsinhalte, keine Namen, keine Konten und setzt keine Cookies. Es gibt kein Login.</p>
<h2>Speicherung</h2>
<p>Der Server speichert keine Anfragen. Der Betreiber der Infrastruktur, Cloudflare, Inc., verarbeitet technische
Verbindungsdaten (z. B. IP-Adresse, Zeitpunkt) für Betrieb und Sicherheit gemäss
<a href="https://www.cloudflare.com/privacypolicy/">Datenschutzerklärung von Cloudflare</a>; solche Protokolle werden nur kurzfristig vorgehalten.</p>
<h2>Weitergabe an Dritte</h2>
<p>Nur beim Tool «Zugverbindungen suchen» werden Abfahrtsort, Zielort, Datum und Zeit an
<a href="https://transport.opendata.ch">transport.opendata.ch</a> übermittelt, um den Fahrplan abzufragen. Sonst keine Weitergabe, kein Verkauf, keine Werbung.</p>
<h2>Aufbewahrung</h2><p>Keine Aufbewahrung durch den Server; Infrastrukturprotokolle siehe oben.</p>
<h2>Ihre Rechte</h2><p>Fragen und Auskunftsbegehren über <a href="${KONTAKT}">GitHub Issues</a>.</p>
<hr>
<h1>Privacy Policy (English)</h1>
<p>Last updated: ${STAND}. Controller: Stefan Eicher, Switzerland. Contact: <a href="${KONTAKT}">GitHub Issues</a>.</p>
<p><strong>Data collected:</strong> only the tool parameters of each call (e.g. area, lift ID, origin and destination station).
No conversation content, no names, no accounts, no cookies, no login.</p>
<p><strong>Storage and retention:</strong> the server stores no requests. The hosting provider Cloudflare, Inc. processes
technical connection data (e.g. IP address, timestamp) for operation and security under its
<a href="https://www.cloudflare.com/privacypolicy/">privacy policy</a>, retained short-term only.</p>
<p><strong>Third parties:</strong> only the "search train connections" tool sends origin, destination, date and time to
<a href="https://transport.opendata.ch">transport.opendata.ch</a> to look up the timetable. No other sharing, no sale, no advertising.</p>
<p><strong>Your rights:</strong> questions and requests via <a href="${KONTAKT}">GitHub Issues</a>.</p>`);

export const nutzungsbedingungen = () =>
  seite("Nutzungsbedingungen", `<h1>Nutzungsbedingungen</h1>
<p>Stand: ${STAND}.</p>
<ul><li>«Bergbahn-Info» ist ein kostenloses, inoffizielles Lern- und Demoprojekt.</li>
<li>Bahnen, Lifte, Pisten und Schneebericht sind <strong>erfundene Demodaten</strong>. Nicht für echte Tourenplanung oder Sicherheitsentscheide verwenden.</li>
<li>Zugverbindungen stammen von transport.opendata.ch; massgebend ist der offizielle Fahrplan.</li>
<li>Keine Gewähr für Verfügbarkeit oder Richtigkeit. Haftung soweit gesetzlich zulässig ausgeschlossen.</li>
<li>Der Quellcode steht unter MIT-Lizenz. Es gilt Schweizer Recht.</li></ul>
<hr><h1>Terms of Use (English)</h1>
<ul><li>"Bergbahn-Info" is a free, unofficial learning and demo project.</li>
<li>Lifts, slopes and snow report are <strong>fictional demo data</strong>. Do not use them for real trip planning or safety decisions.</li>
<li>Train connections come from transport.opendata.ch; the official timetable prevails.</li>
<li>No warranty of availability or accuracy; liability excluded to the extent permitted by law.</li>
<li>Source code under the MIT License. Swiss law applies.</li></ul>`);
