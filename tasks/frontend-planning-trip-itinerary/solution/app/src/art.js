// art.js — locally generated inline SVG illustrations. No external images,
// no tile servers, no CDNs. Keeps the console clean and the bundle offline.

const SCENES = {
  food: { sky: "#f6d9b0", land: "#e7a86b", sea: "#7fb4cf", accent: "#d2603a" },
  harbour: { sky: "#bfe0ef", land: "#d8a07a", sea: "#3f8fc4", accent: "#1d4e89" },
  hotel: { sky: "#e9d7c2", land: "#9a8266", sea: "#caa988", accent: "#e0952f" },
  museum: { sky: "#dfe6f2", land: "#cbb7d6", sea: "#7b6fb0", accent: "#5b4f8f" },
  garden: { sky: "#cfe9d8", land: "#5fae84", sea: "#3f8f7a", accent: "#2a9d8f" },
  village: { sky: "#e7eef6", land: "#cdb98f", sea: "#8fa9c4", accent: "#cf6088" },
  beach: { sky: "#bfe6ef", land: "#f0d9a8", sea: "#43a7c4", accent: "#e76f51" },
};
export const SCENE_KINDS = Object.keys(SCENES);

export function sceneSVG(kind, w = 400, h = 300) {
  const c = SCENES[kind] || SCENES.harbour;
  const id = kind;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
    <defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.sky}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.25"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#sky-${id})"/>
    <circle cx="${w * 0.78}" cy="${h * 0.26}" r="${h * 0.13}" fill="#fff" opacity="0.55"/>
    <path d="M0 ${h * 0.62} Q ${w * 0.3} ${h * 0.5} ${w * 0.55} ${h * 0.6} T ${w} ${h * 0.55} V ${h} H0 Z" fill="${c.sea}" opacity="0.85"/>
    <path d="M0 ${h * 0.7} Q ${w * 0.4} ${h * 0.64} ${w * 0.7} ${h * 0.72} T ${w} ${h * 0.7} V ${h} H0 Z" fill="${c.sea}"/>
    <path d="M0 ${h * 0.5} L ${w * 0.18} ${h * 0.34} L ${w * 0.34} ${h * 0.5} Z" fill="${c.land}"/>
    <path d="M${w * 0.4} ${h * 0.52} L ${w * 0.62} ${h * 0.3} L ${w * 0.84} ${h * 0.52} Z" fill="${c.land}" opacity="0.9"/>
    <rect x="${w * 0.2}" y="${h * 0.42}" width="${w * 0.07}" height="${h * 0.12}" fill="${c.accent}"/>
    <rect x="${w * 0.5}" y="${h * 0.4}" width="${w * 0.06}" height="${h * 0.14}" fill="${c.accent}" opacity="0.85"/>
    <rect x="${w * 0.66}" y="${h * 0.44}" width="${w * 0.05}" height="${h * 0.1}" fill="${c.accent}" opacity="0.8"/>
    <path d="M0 ${h * 0.78} Q ${w * 0.5} ${h * 0.74} ${w} ${h * 0.8}" stroke="#fff" stroke-opacity="0.4" stroke-width="2" fill="none"/>
  </svg>`;
}

export function coverSVG() {
  return `<svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Cote d'Azur coastline at dusk">
    <defs>
      <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a3f63"/><stop offset="0.45" stop-color="#c7705f"/><stop offset="0.7" stop-color="#e8a87c"/><stop offset="1" stop-color="#f4d2ad"/></linearGradient>
      <linearGradient id="csea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3f7fa6"/><stop offset="1" stop-color="#27597c"/></linearGradient>
    </defs>
    <rect width="1200" height="380" fill="url(#csky)"/>
    <circle cx="820" cy="150" r="46" fill="#ffe2b0" opacity="0.9"/>
    <circle cx="820" cy="150" r="70" fill="#ffe2b0" opacity="0.25"/>
    <path d="M0 250 L150 196 L300 244 L470 188 L640 246 L820 200 L1000 250 L1200 214 V380 H0 Z" fill="#1f3550" opacity="0.92"/>
    <path d="M0 268 L220 232 L420 270 L640 236 L880 272 L1100 240 L1200 262 V380 H0 Z" fill="#16283d"/>
    <rect y="262" width="1200" height="118" fill="url(#csea)"/>
    <path d="M760 268 H880" stroke="#ffe2b0" stroke-opacity="0.6" stroke-width="6"/>
    <path d="M0 300 Q300 286 600 302 T1200 300" stroke="#fff" stroke-opacity="0.18" stroke-width="3" fill="none"/>
    <path d="M0 330 Q300 318 600 332 T1200 330" stroke="#fff" stroke-opacity="0.12" stroke-width="3" fill="none"/>
  </svg>`;
}

// Deterministic pin position along the stylised coast for a stop.
const COAST = [
  [70, 78], [120, 70], [176, 64], [232, 70], [300, 58], [356, 66], [408, 52],
]; // base anchor per day index (in 460x640 viewBox units), x right-ish
export function mapSVG(stops, selectedId) {
  const byDay = {};
  for (const s of stops) (byDay[s.day] = byDay[s.day] || []).push(s);
  const dayIdx = { "2025-07-05": 0, "2025-07-06": 1, "2025-07-07": 2, "2025-07-08": 3, "2025-07-09": 4, "2025-07-10": 5, "2025-07-11": 6 };
  const hex = ["#e76f51", "#2a9d8f", "#e0952f", "#7b6fb0", "#3f8fc4", "#43a77f", "#cf6088"];
  let pins = "";
  for (const s of stops) {
    const di = dayIdx[s.day] ?? 0;
    const arr = byDay[s.day];
    const k = arr.indexOf(s);
    const [bx, by] = COAST[di];
    const x = Math.round(bx + (k % 2 ? 14 : -10) + k * 3);
    const y = Math.round(by * 6.2 + (k % 2 ? 26 : -8));
    const sel = s.id === selectedId;
    const color = hex[di];
    pins += `<g class="pin" role="button" tabindex="0" aria-pressed="${sel}" aria-label="Select stop: ${esc(s.title)}" data-stop="${s.id}" transform="translate(${x} ${y})">
      <path d="M0 0 C -11 -16 -11 -30 0 -30 C 11 -30 11 -16 0 0 Z" fill="${color}" stroke="#fff" stroke-width="1.6"/>
      <circle cx="0" cy="-21" r="7.5" fill="#fff" opacity="0.9"/>
      <text x="0" y="-17.5" text-anchor="middle" fill="${color}" style="font:800 9px var(--font)">${k + 1}</text>
    </g>`;
  }
  const towns = [["Nice", 96, 120], ["Monaco", 150, 96], ["Cannes", 250, 150], ["Antibes", 320, 120], ["Eze", 132, 70], ["Saint-Tropez", 372, 200], ["Menton", 196, 70]];
  const townSvg = towns.map(([n, x, y]) => `<text x="${x}" y="${y}" style="font:600 11px var(--font)" fill="var(--ink-soft)">${n}</text>`).join("");
  return `<svg class="map-art" viewBox="0 0 460 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Static snapshot map of the French Riviera with one pin per stop">
    <rect width="460" height="640" fill="var(--map-sea)"/>
    <path d="M120 0 C 150 80 90 140 150 200 C 210 260 150 330 230 400 C 300 460 250 540 340 600 L460 640 L460 0 Z" fill="var(--map-land)"/>
    <path d="M120 0 C 150 80 90 140 150 200 C 210 260 150 330 230 400 C 300 460 250 540 340 600" fill="none" stroke="var(--map-line)" stroke-width="2"/>
    <path d="M70 130 L96 120 L132 70 L150 96 L196 70 L250 150 L320 120 L372 200" fill="none" stroke="#e0533f" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 0" opacity="0.85"/>
    <g opacity="0.5">${[...Array(5)].map((_, i) => `<path d="M0 ${420 + i * 36} Q 120 ${408 + i * 36} 240 ${424 + i * 36} T 460 ${420 + i * 36}" stroke="#fff" stroke-width="2" fill="none"/>`).join("")}</g>
    ${townSvg}
    ${pins}
  </svg>`;
}

export function receiptSVG() {
  return `<svg viewBox="0 0 320 220" role="img" aria-label="Sample cafe receipt">
    <rect width="320" height="220" fill="var(--surface-2)"/>
    <rect x="70" y="22" width="180" height="176" rx="4" fill="var(--surface)" stroke="var(--line)"/>
    <text x="160" y="48" text-anchor="middle" style="font:800 13px var(--font)" fill="var(--ink)">CAFE DE LA PLAGE</text>
    <line x1="86" y1="58" x2="234" y2="58" stroke="var(--line)" stroke-dasharray="3 3"/>
    <text x="86" y="80" style="font:600 11px var(--mono)" fill="var(--ink-2)">Espresso x2</text><text x="234" y="80" text-anchor="end" style="font:600 11px var(--mono)" fill="var(--ink-2)">8.00</text>
    <text x="86" y="100" style="font:600 11px var(--mono)" fill="var(--ink-2)">Tarte citron</text><text x="234" y="100" text-anchor="end" style="font:600 11px var(--mono)" fill="var(--ink-2)">6.50</text>
    <text x="86" y="120" style="font:600 11px var(--mono)" fill="var(--ink-2)">Jus d'orange</text><text x="234" y="120" text-anchor="end" style="font:600 11px var(--mono)" fill="var(--ink-2)">4.50</text>
    <line x1="86" y1="132" x2="234" y2="132" stroke="var(--line)"/>
    <text x="86" y="152" style="font:800 12px var(--mono)" fill="var(--ink)">TOTAL EUR</text><text x="234" y="152" text-anchor="end" style="font:800 12px var(--mono)" fill="var(--ink)">19.00</text>
    <text x="86" y="176" style="font:600 10px var(--mono)" fill="var(--ink-soft)">2025-07-10  13:42</text>
  </svg>`;
}

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
