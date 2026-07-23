// charts.js — hand-rolled inline SVG charts. Theme-aware through CSS variables
// (the inline SVG inherits custom properties), so light/dark stay coherent
// without re-rendering. No chart library, no canvas warnings.
import { DAY_META, BUDGET_CEILING, dailySeries, categoryTotalsEur, grandTotalEur, EXP_CATS } from "./core.js";

const CAT_COLOR = { Lodging: "var(--d3)", Food: "var(--d0)", Transit: "var(--d4)", Activities: "var(--d1)" };

export function burnChart(state) {
  const W = 540, H = 230, padL = 46, padR = 16, padT = 18, padB = 34;
  const { cum, proj } = dailySeries(state.expenses);
  const maxV = Math.max(BUDGET_CEILING, ...proj, ...cum) * 1.12;
  const ix = (i) => padL + (i * (W - padL - padR)) / (DAY_META.length - 1);
  const iy = (v) => padT + (H - padT - padB) * (1 - v / maxV);
  const ticks = [0, 1500, 3000, BUDGET_CEILING, Math.ceil(maxV / 1500) * 1500].filter((v) => v <= maxV + 1);
  let grid = "";
  for (const t of [...new Set(ticks)]) {
    const y = iy(t);
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line-2)" stroke-width="1"/>`;
    grid += `<text x="${padL - 8}" y="${y + 3}" text-anchor="end" style="font:600 9px var(--font)" fill="var(--ink-faint)">${t.toLocaleString("en-US")}</text>`;
  }
  let xlab = "";
  for (let i = 0; i < DAY_META.length; i++) xlab += `<text x="${ix(i)}" y="${H - 12}" text-anchor="middle" style="font:600 9px var(--font)" fill="var(--ink-faint)">${DAY_META[i].md}</text>`;

  // overage region between projection and ceiling where projection > ceiling
  let over = "";
  const ceilY = iy(BUDGET_CEILING);
  const pts = proj.map((v, i) => [ix(i), v]);
  let poly = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, v] = pts[i];
    if (v > BUDGET_CEILING) {
      if (i > 0 && proj[i - 1] <= BUDGET_CEILING) {
        const [px, pv] = pts[i - 1];
        const t = (BUDGET_CEILING - pv) / (v - pv);
        poly.push([px + (x - px) * t, ceilY]);
      }
      poly.push([x, iy(v)]);
      if (i < pts.length - 1 && proj[i + 1] <= BUDGET_CEILING) {
        const [nx, nv] = pts[i + 1];
        const t = (BUDGET_CEILING - v) / (nv - v);
        poly.push([x + (nx - x) * t, ceilY]);
      }
    }
  }
  if (poly.length >= 3) {
    const top = poly.map((p) => p.join(",")).join(" ");
    const lastX = poly[poly.length - 1][0], firstX = poly[0][0];
    over = `<polygon class="overage" points="${top} ${lastX},${ceilY} ${firstX},${ceilY}" fill="var(--danger)" opacity="0.16"/>`;
  }

  const linePath = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${ix(i)} ${iy(v)}`).join(" ");
  const dots = (arr, cls, fill) => arr.map((v, i) => `<circle class="${cls}" cx="${ix(i)}" cy="${iy(v)}" r="3" fill="${fill}"/>`).join("");

  const overLabel = poly.length >= 3 ? `<text x="${W - padR}" y="${ceilY - 6}" text-anchor="end" style="font:700 9px var(--font)" fill="var(--danger)">Projected overage</text>` : "";

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Burn rate chart: cumulative spend per day against the ${BUDGET_CEILING} EUR ceiling, with a projected line including reserved lodging and flight. Projected end of trip ${Math.round((grandTotalEur(state.expenses) + 1620))} EUR.">
    ${grid}
    <line class="ceil-line" x1="${padL}" y1="${ceilY}" x2="${W - padR}" y2="${ceilY}" stroke="var(--warn)" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="${padL + 4}" y="${ceilY - 5}" style="font:700 9px var(--font)" fill="var(--warn)">${BUDGET_CEILING.toLocaleString("en-US")} EUR ceiling</text>
    ${over}
    ${overLabel}
    <path class="proj-line" d="${linePath(proj)}" fill="none" stroke="var(--accent-2)" stroke-width="2" stroke-dasharray="5 4"/>
    <path class="burn-line" d="${linePath(cum)}" fill="none" stroke="var(--accent)" stroke-width="2.6"/>
    ${dots(cum, "burn-line", "var(--accent)")}
    ${dots(proj, "proj-line", "var(--accent-2)")}
    ${xlab}
    <text x="${padL - 34}" y="${padT - 6}" style="font:700 9px var(--font)" fill="var(--ink-faint)">EUR</text>
  </svg>`;
  return svg;
}

export function donut(state) {
  const totals = categoryTotalsEur(state.expenses);
  const total = grandTotalEur(state.expenses) || 1;
  const items = EXP_CATS.map((c) => ({ label: c, eur: Math.round(totals[c] * 100) / 100, pct: totals[c] / total, color: CAT_COLOR[c] }));
  const R = 52, C = 2 * Math.PI * R, cx = 70, cy = 70;
  let off = 0, arcs = "";
  for (const it of items) {
    const len = C * it.pct;
    arcs += `<circle class="slice" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${it.color}" stroke-width="20"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
      <title>${it.label}: ${it.eur.toLocaleString("en-US", { minimumFractionDigits: 2 })} EUR (${(it.pct * 100).toFixed(0)}%)</title></circle>`;
    off += len;
  }
  const svg = `<svg viewBox="0 0 140 140" role="img" aria-label="Cost allocation by category. ${items.map((i) => `${i.label} ${i.eur.toFixed(2)} EUR`).join(", ")}">
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font:800 15px var(--font)" fill="var(--ink)">${Math.round(total).toLocaleString("en-US")}</text>
    <text x="${cx}" y="${cy + 13}" text-anchor="middle" style="font:600 9px var(--font)" fill="var(--ink-soft)">EUR total</text>
  </svg>`;
  return { svg, items, total };
}

export function debtNetwork(outstanding, transactions) {
  const W = 320, H = 110;
  const names = ["Ava", "Ben", "Chloe", "Dan"];
  const pos = { Ava: [40, 55], Ben: [120, 30], Chloe: [200, 80], Dan: [280, 55] };
  const color = { Ava: "var(--d0)", Ben: "var(--d4)", Chloe: "var(--d1)", Dan: "var(--d3)" };
  let edges = "";
  for (const t of transactions) {
    const [x1, y1] = pos[t.from], [x2, y2] = pos[t.to];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
    edges += `<path d="M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#arr)"/>`;
    edges += `<text x="${mx}" y="${my - 2}" text-anchor="middle" style="font:700 9px var(--font)" fill="var(--accent)">${t.amount.toFixed(2)}</text>`;
  }
  const nodes = names.map((n) => {
    const [x, y] = pos[n];
    const v = Math.round((outstanding[n] || 0) * 100) / 100;
    const lbl = v > 0.005 ? `+${v.toFixed(0)}` : v < -0.005 ? `${v.toFixed(0)}` : "0";
    return `<g><circle cx="${x}" cy="${y}" r="17" fill="var(--surface)" stroke="${color[n]}" stroke-width="2.5"/>
      <text x="${x}" y="${y + 1}" text-anchor="middle" style="font:800 10px var(--font)" fill="var(--ink)">${n.slice(0, 3)}</text>
      <text x="${x}" y="${y + 30}" text-anchor="middle" style="font:700 9px var(--font)" fill="${v >= 0 ? "var(--ok)" : "var(--danger)"}">${lbl}</text></g>`;
  }).join("");
  const settled = transactions.length === 0;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${settled ? "All settled up, zero outstanding transactions" : `Who owes whom: ${transactions.length} minimum settlement transaction(s)`}">
    <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="var(--accent)"/></marker></defs>
    ${edges}${nodes}
    ${settled ? `<text x="${W / 2}" y="${H / 2 + 4}" text-anchor="middle" style="font:800 13px var(--font)" fill="var(--ok)">All settled up!</text>` : ""}
  </svg>`;
}
