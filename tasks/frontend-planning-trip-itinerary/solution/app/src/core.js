// core.js — Riviera Trip Planner: helpers, icons, domain constants, field-contract
// validators, the reactive in-memory store (with undo/redo), derived money
// computations, and the live export builders (ICS / trip JSON / markdown).
// No external dependencies, no network, no browser storage.

// ------------------------------- DOM helpers -------------------------------
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.appendChild(typeof kid === "string" || typeof kid === "number" ? document.createTextNode(String(kid)) : kid);
  }
  return el;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export function uid(p = "id") { return p + "_" + Math.random().toString(36).slice(2, 9); }
export function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
export function deepClone(o) { return structuredClone(o); }

// --------------------------------- Icons -----------------------------------
// Minimal inline stroke icons (currentColor). No icon CDN, no pasted sprite set.
const P = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const icon = {
  compass: P(`<circle cx="12" cy="12" r="9"/><polygon points="16 8 13 13 8 16 11 11 16 8"/>`),
  undo: P(`<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>`),
  redo: P(`<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>`),
  share: P(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/>`),
  dots: P(`<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>`),
  sparkles: P(`<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6 6 2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>`),
  chevronDown: P(`<polyline points="6 9 12 15 18 9"/>`),
  chevronRight: P(`<polyline points="9 6 15 12 9 18"/>`),
  chevronLeft: P(`<polyline points="15 6 9 12 15 18"/>`),
  list: P(`<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>`),
  map: P(`<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>`),
  calendar: P(`<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>`),
  pencil: P(`<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>`),
  plus: P(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`),
  trash: P(`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`),
  x: P(`<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`),
  check: P(`<polyline points="20 6 9 17 4 12"/>`),
  search: P(`<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>`),
  layers: P(`<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`),
  route: P(`<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H14a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-7h5.5"/>`),
  zoomIn: P(`<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>`),
  zoomOut: P(`<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="8" y1="11" x2="14" y2="11"/>`),
  alert: P(`<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/>`),
  info: P(`<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/>`),
  download: P(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`),
  copy: P(`<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`),
  upload: P(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`),
  image: P(`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>`),
  table: P(`<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>`),
  file: P(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>`),
  sun: P(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`),
  moon: P(`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>`),
  sidebar: P(`<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>`),
  lifebuoy: P(`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5 5 4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>`),
  star: P(`<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/>`),
  grip: P(`<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>`),
  link: P(`<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>`),
  package: P(`<path d="m7.5 4.3 9 5.2M21 16V8l-9-5-9 5v8l9 5 9-5Z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>`),
  tag: P(`<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.4Z"/><circle cx="7.5" cy="7.5" r="1.2"/>`),
  euro: P(`<path d="M18 7a6 6 0 1 0 0 10"/><line x1="3" y1="10" x2="13" y2="10"/><line x1="3" y1="14" x2="13" y2="14"/>`),
  pie: P(`<path d="M21 15.5A9 9 0 1 1 8.5 3"/><path d="M21 12A9 9 0 0 0 12 3v9Z"/>`),
  flame: P(`<path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8Z"/>`),
  users: P(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1A4 4 0 0 1 16 11"/>`),
  menu: P(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  receipt: P(`<path d="M5 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/>`),
  wand: P(`<path d="m15 4 5 5-9 9-5 1 1-5 8-9Z"/><path d="M5 3v3M3 5h3M19 14v2M18 15h2"/>`),
  reset: P(`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>`),
  pin: P(`<path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>`),
};

// --------------------------- Domain constants ------------------------------
// NOTE: weekday mapping follows the reference UI (Sun 7/5 … Sat 7/11), not the
// real-world 2025 calendar — the reference sidebar labels define the contract.
export const DAY_META = [
  { date: "2025-07-05", dow: "Sun", md: "7/5", color: "var(--d0)", hex: "#e76f51" },
  { date: "2025-07-06", dow: "Mon", md: "7/6", color: "var(--d1)", hex: "#2a9d8f" },
  { date: "2025-07-07", dow: "Tue", md: "7/7", color: "var(--d2)", hex: "#e0952f" },
  { date: "2025-07-08", dow: "Wed", md: "7/8", color: "var(--d3)", hex: "#7b6fb0" },
  { date: "2025-07-09", dow: "Thu", md: "7/9", color: "var(--d4)", hex: "#3f8fc4" },
  { date: "2025-07-10", dow: "Fri", md: "7/10", color: "var(--d5)", hex: "#43a77f" },
  { date: "2025-07-11", dow: "Sat", md: "7/11", color: "var(--d6)", hex: "#cf6088" },
];
export const DATES = DAY_META.map((d) => d.date);
export const dayMeta = (date) => DAY_META.find((d) => d.date === date) || DAY_META[0];
export const dayLabel = (date) => { const m = dayMeta(date); return `${m.dow}, ${m.md}`; };

export const STOP_CATS = ["sightseeing", "dining", "lodging", "transport", "other"];
export const EXP_CATS = ["Lodging", "Food", "Transit", "Activities"];
export const EXP_CUR = ["EUR", "USD", "GBP", "CHF"];
export const EXP_PAYERS = ["Ava", "Ben", "Chloe", "Dan"];
export const SPLIT_MODES = ["per-capita", "weighted"];
// Mock FX table: units of foreign currency per 1 EUR.
export const FX = { EUR: 1, USD: 0.92, GBP: 1.16, CHF: 1.05 };
export const BUDGET_CEILING = 4500;
// Reserved (committed, not yet incurred) costs that feed the burn-rate projection.
export const RESERVED = { "2025-07-10": 720, "2025-07-11": 900 }; // lodging night + return flight

// ------------------------------- Formatters --------------------------------
export function fmtMoney(eurAmount, ccy = "EUR") {
  const v = ccy === "EUR" ? eurAmount : eurAmount / FX[ccy];
  const s = v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${s} ${ccy}`;
}
export function fmtEur(eur) { return fmtMoney(eur, "EUR"); }
export function toEur(exp) { return exp.amount * (FX[exp.currency] || 1); }
export const fmtTimeRange = (s, e) => (s && e ? `${s}–${e}` : s || "");

// ----------------------------- Validators ----------------------------------
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validateStop(s) {
  const e = {};
  const title = (s.title || "").trim();
  if (!title) e.title = "Title is required.";
  else if (title.length > 80) e.title = "Title must be 80 characters or fewer.";
  if (!DATES.includes(s.day)) e.day = "Day must be one of the seven trip dates.";
  if (!STOP_CATS.includes(s.category)) e.category = "Category must be sightseeing, dining, lodging, transport, or other.";
  if (s.location != null && s.location !== "" && s.location.length > 120) e.location = "Location must be 120 characters or fewer.";
  const notes = s.notes == null ? "" : s.notes;
  if (notes.length > 400) e.notes = "Notes must be 400 characters or fewer.";
  if (s.startTime != null && s.startTime !== "") {
    if (!HHMM.test(s.startTime)) e.startTime = "Start time must be HH:MM on a 24-hour clock.";
  }
  if (s.endTime != null && s.endTime !== "") {
    if (!s.startTime || s.startTime === "") e.endTime = "End time requires a start time.";
    else if (!HHMM.test(s.endTime)) e.endTime = "End time must be HH:MM on a 24-hour clock.";
    else if (s.endTime <= s.startTime) e.endTime = "End time must be strictly after start time.";
  }
  return { ok: Object.keys(e).length === 0, errors: e };
}
const amt2dp = (n) => Number.isFinite(n) && Math.round(n * 100) / 100 === n;
export function validateExpense(x) {
  const e = {};
  const desc = (x.description || "").trim();
  if (!desc) e.description = "Description is required.";
  else if (desc.length > 120) e.description = "Description must be 120 characters or fewer.";
  const amt = Number(x.amount);
  if (x.amount === "" || x.amount == null || !Number.isFinite(amt)) e.amount = "Amount must be a number greater than 0.";
  else if (amt <= 0) e.amount = "Amount must be greater than 0.";
  else if (!amt2dp(amt)) e.amount = "Amount may have at most two decimal places.";
  if (!EXP_CUR.includes(x.currency)) e.currency = "Currency must be EUR, USD, GBP, or CHF.";
  if (!DATES.includes(x.day)) e.day = "Day must be one of the seven trip dates.";
  if (!EXP_CATS.includes(x.category)) e.category = "Category must be Lodging, Food, Transit, or Activities.";
  if (!EXP_PAYERS.includes(x.payer)) e.payer = "Payer must be Ava, Ben, Chloe, or Dan.";
  if (!SPLIT_MODES.includes(x.splitMode)) e.splitMode = "Split mode must be per-capita or weighted.";
  if (x.splitMode === "weighted") {
    const w = x.weights || {};
    const vals = EXP_PAYERS.map((p) => Number(w[p]));
    if (EXP_PAYERS.some((p) => w[p] == null || w[p] === "" || !Number.isFinite(Number(w[p])) || Number(w[p]) <= 0))
      e.weights = "Each traveler weight must be a number greater than 0.";
    else if (vals.reduce((a, b) => a + b, 0) <= 0) e.weights = "Weights must sum to a positive total.";
  }
  return { ok: Object.keys(e).length === 0, errors: e };
}
export function validateTripJson(obj) {
  if (!obj || typeof obj !== "object") return { ok: false, error: "Trip JSON must be an object." };
  if (String(obj.schemaVersion) !== "1") return { ok: false, error: "schemaVersion must be the string \"1\"." };
  const t = obj.trip;
  if (!t || typeof t !== "object") return { ok: false, error: "trip object is required." };
  if (typeof t.title !== "string" || !t.title.trim()) return { ok: false, error: "trip.title must be a non-empty string." };
  if (t.dateStart !== "2025-07-05" || t.dateEnd !== "2025-07-11") return { ok: false, error: "trip.dateStart/dateEnd must be 2025-07-05 / 2025-07-11." };
  if (Number(t.budgetCeilingEur) !== BUDGET_CEILING) return { ok: false, error: "trip.budgetCeilingEur must be 4500." };
  if (!Array.isArray(obj.stops)) return { ok: false, error: "stops must be an array." };
  if (!Array.isArray(obj.expenses)) return { ok: false, error: "expenses must be an array." };
  for (let i = 0; i < obj.stops.length; i++) {
    const r = validateStop(obj.stops[i]);
    if (!r.ok) return { ok: false, error: `stops[${i}] violates the stop contract: ${Object.values(r.errors)[0]}` };
  }
  for (let i = 0; i < obj.expenses.length; i++) {
    const r = validateExpense(obj.expenses[i]);
    if (!r.ok) return { ok: false, error: `expenses[${i}] violates the expense contract: ${Object.values(r.errors)[0]}` };
  }
  return { ok: true, error: null };
}

// ------------------------------- Seed data ---------------------------------
function seedStops() {
  const S = (title, day, category, extra = {}) => ({ id: uid("stop"), title, day, category, ...extra });
  return [
    S("Nice Airport Arrival", "2025-07-05", "transport", { startTime: "09:30", endTime: "10:15", location: "Nice Cote d'Azur Airport", notes: "Tram line 2 into the centre." }),
    S("Old Town Nice Lunch", "2025-07-05", "dining", { startTime: "12:30", endTime: "14:00", location: "Vieux Nice", notes: "Socca and pan bagnat on Cours Saleya." }),
    S("Hotel Negresco Check-in", "2025-07-05", "lodging", { startTime: "15:00", endTime: "15:30", location: "Promenade des Anglais" }),
    S("Castle Hill Sunset", "2025-07-05", "sightseeing", { startTime: "18:00", endTime: "19:30", location: "Colline du Chateau" }),
    S("Prince's Palace of Monaco", "2025-07-06", "sightseeing", { startTime: "10:00", endTime: "11:30", location: "Monaco-Ville" }),
    S("Monte Carlo Casino", "2025-07-06", "other", { startTime: "14:00", endTime: "16:00", location: "Place du Casino" }),
    S("La Croisette Stroll", "2025-07-07", "sightseeing", { startTime: "10:00", endTime: "11:00", location: "Cannes" }),
    S("Cannes Seafood Lunch", "2025-07-07", "dining", { startTime: "12:30", endTime: "13:30", location: "Le Suquet" }),
    S("Musee Picasso", "2025-07-08", "sightseeing", { startTime: "10:00", endTime: "12:00", location: "Chateau Grimaldi, Antibes", notes: "The seeded place-detail example." }),
    S("Cap d'Antibes Walk", "2025-07-08", "sightseeing", { startTime: "13:30", endTime: "15:00", location: "Sentier du Littoral" }),
    S("Eze Village", "2025-07-09", "sightseeing", { startTime: "10:00", endTime: "11:30", location: "Eze" }),
    S("Jardin Exotique d'Eze", "2025-07-09", "sightseeing", { startTime: "12:00", endTime: "13:00", location: "Eze" }),
    S("Place des Lices Market", "2025-07-10", "sightseeing", { startTime: "11:00", endTime: "12:00", location: "Saint-Tropez" }),
    S("Rolls Coffee Saint-Tropez", "2025-07-10", "dining", { startTime: "12:30", endTime: "13:15", location: "Saint-Tropez" }),
    S("Menton Old Town", "2025-07-11", "sightseeing", { startTime: "09:30", endTime: "11:00", location: "Menton", notes: "Farewell morning on the coast." }),
  ];
}
function seedExpenses() {
  const E = (description, amount, currency, day, category, payer, splitMode = "per-capita", weights) => ({
    id: uid("exp"), description, amount, currency, day, category, payer, splitMode,
    ...(splitMode === "weighted" ? { weights } : {}),
  });
  return [
    E("Hotel Negresco, 3 nights", 980, "EUR", "2025-07-05", "Lodging", "Ava"),
    E("Monte Carlo hotel", 640, "EUR", "2025-07-06", "Lodging", "Ben", "weighted", { Ava: 1, Ben: 2, Chloe: 1, Dan: 1 }),
    E("Nice airport tram", 8, "EUR", "2025-07-05", "Transit", "Chloe"),
    E("Monaco regional train", 22, "EUR", "2025-07-06", "Transit", "Dan"),
    E("Old Town lunch", 64, "EUR", "2025-07-05", "Food", "Ava"),
    E("Cannes seafood dinner", 120, "USD", "2025-07-07", "Food", "Ben"),
    E("Saint-Tropez cafe", 38, "GBP", "2025-07-10", "Food", "Chloe"),
    E("Musee Picasso tickets", 14, "EUR", "2025-07-08", "Activities", "Dan"),
    E("Cap d'Antibes boat tour", 90, "CHF", "2025-07-09", "Activities", "Ava", "weighted", { Ava: 2, Ben: 1, Chloe: 1, Dan: 1 }),
    E("Jardin Exotique entry", 11, "EUR", "2025-07-09", "Activities", "Ben"),
    E("Menton gelato", 18, "EUR", "2025-07-11", "Food", "Chloe"),
    E("Return airport transfer", 125, "EUR", "2025-07-11", "Transit", "Dan"),
  ];
}
function seedPacking() {
  const it = (label, done = false) => ({ id: uid("pk"), label, done });
  return {
    Documents: [it("Passports", true), it("Travel insurance", true), it("Booking confirmations"), it("Driving licence")],
    Clothing: [it("Swimwear", true), it("Light layers"), it("Walking shoes", true), it("Sun hat"), it("Evening outfit")],
    Tech: [it("Phone charger", true), it("Power bank"), it("Camera"), it("EU adapter", true)],
    Toiletries: [it("Sunscreen", true), it("Reusable bottle"), it("Medication")],
  };
}

export function seedState() {
  return {
    stops: seedStops(),
    expenses: seedExpenses(),
    settled: {},
    customFields: [],
    customValues: {},
    packing: seedPacking(),
    caps: { Lodging: null, Food: null, Transit: null, Activities: null },
    tripTitle: "Trip to the French Riviera - Cote d'Azur",
    galleries: {},
    notesDoc:
      "# Riviera trip notes\n\nPack light layers; evenings on the coast turn breezy.\n\n## Must-do\n- Sunrise walk on the Promenade des Anglais\n- Socca lunch in Vieux Nice\n- [x] Reserve Musee Picasso tickets\n- [ ] Book the Cap d'Antibes boat\n\nSee the harbour guide: https://www.riviera.example/harbour\n",
  };
}

// --------------------------- Derived computations --------------------------
export function categoryTotalsEur(expenses) {
  const t = Object.fromEntries(EXP_CATS.map((c) => [c, 0]));
  for (const x of expenses) t[x.category] = (t[x.category] || 0) + toEur(x);
  return t;
}
export function grandTotalEur(expenses) {
  return expenses.reduce((a, x) => a + toEur(x), 0);
}
// Per-traveler share of one expense (EUR).
function sharesOf(x) {
  const eur = toEur(x);
  const out = {};
  if (x.splitMode === "weighted") {
    const w = x.weights || {};
    const sum = EXP_PAYERS.reduce((a, p) => a + (Number(w[p]) || 0), 0) || 1;
    for (const p of EXP_PAYERS) out[p] = (eur * (Number(w[p]) || 0)) / sum;
  } else {
    for (const p of EXP_PAYERS) out[p] = eur / 4;
  }
  return out;
}
export function balances(expenses) {
  const net = Object.fromEntries(EXP_PAYERS.map((p) => [p, 0])); // + = is owed, - = owes
  for (const x of expenses) {
    const sh = sharesOf(x);
    net[x.payer] += toEur(x); // payer fronted the whole amount
    for (const p of EXP_PAYERS) net[p] -= sh[p]; // each owes their share
  }
  return net;
}
// Greedy minimal settle-up from a net map.
export function greedySettle(net) {
  const creds = [], debts = [];
  for (const p of EXP_PAYERS) {
    const v = Math.round(net[p] * 100) / 100;
    if (v > 0.005) creds.push({ p, v });
    else if (v < -0.005) debts.push({ p, v: -v });
  }
  creds.sort((a, b) => b.v - a.v); debts.sort((a, b) => b.v - a.v);
  const tx = [];
  let i = 0, j = 0;
  while (i < debts.length && j < creds.length) {
    const amt = Math.min(debts[i].v, creds[j].v);
    if (amt > 0.005) tx.push({ id: `${debts[i].p}>${creds[j].p}`, from: debts[i].p, to: creds[j].p, amount: Math.round(amt * 100) / 100 });
    debts[i].v -= amt; creds[j].v -= amt;
    if (debts[i].v < 0.005) i++;
    if (creds[j].v < 0.005) j++;
  }
  return tx;
}
export function outstandingNet(fullNet, transactions, settled) {
  const net = { ...fullNet };
  for (const t of transactions) {
    if (settled[t.id]) { net[t.from] += t.amount; net[t.to] -= t.amount; }
  }
  return net;
}
export function dailySeries(expenses) {
  const cum = [], proj = [];
  let c = 0, r = 0;
  for (const d of DAY_META) {
    c += expenses.filter((x) => x.day === d.date).reduce((a, x) => a + toEur(x), 0);
    r += RESERVED[d.date] || 0;
    cum.push(Math.round(c * 100) / 100);
    proj.push(Math.round((c + r) * 100) / 100);
  }
  return { cum, proj };
}
export function reservedTotal() { return Object.values(RESERVED).reduce((a, b) => a + b, 0); }
export function projectedEndEur(expenses) { return Math.round((grandTotalEur(expenses) + reservedTotal()) * 100) / 100; }

export function pivot(expenses, mode) {
  const rowKey = mode === "day-cat" ? (x) => dayLabel(x.day) : mode === "payer-cat" ? (x) => x.payer : (x) => x.category;
  const colKey = mode === "day-cat" ? (x) => x.category : mode === "payer-cat" ? (x) => x.category : (x) => dayLabel(x.day);
  const rowOrder = mode === "day-cat" ? DAY_META.map((d) => dayLabel(d.date)) : mode === "payer-cat" ? EXP_PAYERS : EXP_CATS;
  const colOrder = mode === "day-cat" ? EXP_CATS : mode === "payer-cat" ? EXP_CATS : DAY_META.map((d) => dayLabel(d.date));
  const cells = {};
  for (const r of rowOrder) { cells[r] = {}; for (const c of colOrder) cells[r][c] = 0; }
  for (const x of expenses) {
    const r = rowKey(x), c = colKey(x);
    if (cells[r] && cells[r][c] != null) cells[r][c] += toEur(x);
  }
  for (const r of rowOrder) for (const c of colOrder) cells[r][c] = Math.round(cells[r][c] * 100) / 100;
  return { rows: rowOrder, cols: colOrder, cells };
}

// ----------------------------- Export builders -----------------------------
function icsDate(date, time) {
  const d = date.replace(/-/g, "");
  if (!time) return d;
  return d + "T" + time.replace(":", "") + "00";
}
export function buildICS(stops) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Riviera Trip Planner//EN", "CALSCALE:GREGORIAN", "NAME:Trip to the French Riviera"];
  const scheduled = stops.filter((s) => s.startTime);
  for (const s of scheduled) {
    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + s.id + "@riviera-trip-planner");
    lines.push("DTSTART:" + icsDate(s.day, s.startTime));
    if (s.endTime) lines.push("DTEND:" + icsDate(s.day, s.endTime));
    lines.push("SUMMARY:" + icsEscape(s.title));
    if (s.location) lines.push("LOCATION:" + icsEscape(s.location));
    if (s.notes) lines.push("DESCRIPTION:" + icsEscape(s.notes));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }

function cleanStop(s) {
  const o = { title: s.title, day: s.day, category: s.category };
  if (s.location) o.location = s.location;
  if (s.notes) o.notes = s.notes;
  if (s.startTime) o.startTime = s.startTime;
  if (s.endTime) o.endTime = s.endTime;
  return o;
}
function cleanExpense(x) {
  const o = { description: x.description, amount: x.amount, currency: x.currency, day: x.day, category: x.category, payer: x.payer, splitMode: x.splitMode };
  if (x.splitMode === "weighted") o.weights = { ...x.weights };
  return o;
}
export function buildTripJson(state) {
  return {
    schemaVersion: "1",
    trip: { title: state.tripTitle || "Trip to the French Riviera - Cote d'Azur", dateStart: "2025-07-05", dateEnd: "2025-07-11", budgetCeilingEur: BUDGET_CEILING },
    stops: state.stops.map(cleanStop),
    expenses: state.expenses.map(cleanExpense),
  };
}
export function buildMarkdown(state) {
  const out = [`# ${"Trip to the French Riviera - Cote d'Azur"}`, `> 7/5 – 7/11 · 2025`, ""];
  for (const d of DAY_META) {
    const stops = state.stops.filter((s) => s.day === d.date).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
    out.push(`## ${d.dow}, ${d.md}`);
    if (!stops.length) { out.push("_No stops planned._", ""); continue; }
    for (const s of stops) {
      const time = s.startTime ? `${fmtTimeRange(s.startTime, s.endTime)} ` : "";
      const loc = s.location ? ` — ${s.location}` : "";
      out.push(`- ${time}**${s.title}** (${s.category})${loc}`);
      if (s.notes) out.push(`  ${s.notes}`);
    }
    out.push("");
  }
  return out.join("\n").trim() + "\n";
}

// --------------------------- Markdown renderer -----------------------------
export function mdToHtml(md, opts = {}) {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push("</ul>"); list = null; } };
  const inline = (t) =>
    t
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/(https?:\/\/[^\s)]+)/g, (m) => {
        let host = m;
        try { host = new URL(m).hostname.replace(/^www\./, ""); } catch (e) {}
        const title = host.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) + " guide";
        return `<button type="button" class="link-card" data-url="${m}" aria-label="Open link preview for ${host}"><span class="th" aria-hidden="true"><svg viewBox="0 0 44 44"><rect width="44" height="44" fill="var(--accent-soft)"/><circle cx="22" cy="18" r="8" fill="var(--accent)" opacity="0.35"/><path d="M8 36 Q22 22 36 36" fill="var(--accent)" opacity="0.45"/></svg></span><span><span class="t">${title}</span><span class="d">${host}</span></span></button>`;
      });
  for (let raw of lines) {
    const line = raw.replace(/\s+$/g, "");
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { closeList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if ((m = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/))) {
      if (list !== "chk") { closeList(); out.push('<ul class="chk-list">'); list = "chk"; }
      const checked = m[1].toLowerCase() === "x";
      out.push(`<li class="chk"><input type="checkbox" data-mdchk ${checked ? "checked" : ""} aria-label="${inline(m[2]).replace(/<[^>]+>/g, "")}"><span>${inline(m[2])}</span></li>`);
      continue;
    }
    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(m[1])}</li>`); continue;
    }
    if (line.trim() === "") { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

// ------------------------------- The store ---------------------------------
const UNDOABLE = ["stops", "expenses", "settled", "customFields", "customValues", "packing", "caps", "notesDoc", "galleries", "tripTitle"];
export function createStore() {
  const seed = seedState();
  const state = {
    theme: "light",
    view: "explore", // explore | notes | budget
    budgetTab: "ledger", // ledger | spreadsheet | settle | ingest | reports
    mode: "split", // split | list | map
    dayFilter: null,
    selectedStopId: null,
    detailTab: "About",
    drawerOpen: false,
    sbHidden: false,
    docMode: "plan",
    tripTitle: seed.tripTitle,
    displayCurrency: "EUR",
    ledgerSort: { key: "day", dir: "asc" },
    selectedRows: [],
    pivotMode: "cat-day",
    ...seed,
  };
  let initial = deepClone(Object.fromEntries(UNDOABLE.map((k) => [k, state[k]])));
  const undoStack = [];
  const redoStack = [];
  const subs = new Set();

  function emit() { for (const fn of subs) try { fn(state); } catch (e) { console.warn("subscriber", e); } }
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function snapshot() {
    undoStack.push(deepClone(Object.fromEntries(UNDOABLE.map((k) => [k, state[k]]))));
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
  }
  function set(patch) { Object.assign(state, patch); emit(); }

  // ----- stop mutations -----
  function addStop(payload) {
    snapshot();
    const s = { id: uid("stop"), title: (payload.title || "").trim(), day: payload.day, category: payload.category,
      location: payload.location || "", notes: payload.notes || "", startTime: payload.startTime || "", endTime: payload.endTime || "" };
    state.stops = [...state.stops, s];
    if (state.selectedStopId == null) state.selectedStopId = s.id;
    emit();
    return s;
  }
  function updateStop(id, patch) {
    snapshot();
    state.stops = state.stops.map((s) => (s.id === id ? { ...s, ...patch, title: (patch.title != null ? String(patch.title).trim() : s.title) } : s));
    emit();
  }
  function deleteStop(id) {
    snapshot();
    state.stops = state.stops.filter((s) => s.id !== id);
    if (state.selectedStopId === id) state.selectedStopId = state.stops[0] ? state.stops[0].id : null;
    emit();
  }
  // ----- expense mutations -----
  function normalizeExpense(payload) {
    const x = {
      id: payload.id || uid("exp"),
      description: (payload.description || "").trim(),
      amount: Math.round(Number(payload.amount) * 100) / 100,
      currency: payload.currency, day: payload.day, category: payload.category, payer: payload.payer,
      splitMode: payload.splitMode || "per-capita",
    };
    if (x.splitMode === "weighted") x.weights = { ...(payload.weights || {}) };
    return x;
  }
  function addExpense(payload) {
    snapshot();
    const x = normalizeExpense(payload);
    state.expenses = [...state.expenses, x];
    emit();
    return x;
  }
  function updateExpense(id, patch) {
    snapshot();
    state.expenses = state.expenses.map((x) => (x.id === id ? normalizeExpense({ ...x, ...patch, id: x.id }) : x));
    emit();
  }
  function deleteExpense(id) {
    snapshot();
    state.expenses = state.expenses.filter((x) => x.id !== id);
    state.selectedRows = state.selectedRows.filter((r) => r !== id);
    emit();
  }
  function bulkRecategorize(ids, category) { snapshot(); state.expenses = state.expenses.map((x) => (ids.includes(x.id) ? { ...x, category } : x)); state.selectedRows = []; emit(); }
  function bulkReassignDay(ids, day) { snapshot(); state.expenses = state.expenses.map((x) => (ids.includes(x.id) ? { ...x, day } : x)); state.selectedRows = []; emit(); }
  function bulkDelete(ids) { snapshot(); state.expenses = state.expenses.filter((x) => !ids.includes(x.id)); state.selectedRows = []; emit(); }
  // ----- settlement -----
  function toggleSettle(id) { state.settled = { ...state.settled, [id]: !state.settled[id] }; if (!state.settled[id]) delete state.settled[id]; emit(); }
  // ----- custom fields -----
  function addCustomField(name, type) { snapshot(); state.customFields = [...state.customFields, { id: uid("cf"), name: name.trim(), type }]; emit(); }
  function deleteCustomField(id) { snapshot(); state.customFields = state.customFields.filter((c) => c.id !== id); emit(); }
  function setCustomValue(key, cfId, value) { state.customValues = { ...state.customValues, [key]: { ...(state.customValues[key] || {}), [cfId]: value } }; emit(); }
  // ----- packing -----
  function setPacking(cat, itemId, done) {
    state.packing = { ...state.packing, [cat]: state.packing[cat].map((it) => (it.id === itemId ? { ...it, done } : it)) };
    emit();
    return state.packing[cat].every((it) => it.done);
  }
  // ----- caps -----
  function setCap(cat, value) { const n = value === "" || value == null ? null : Number(value); state.caps = { ...state.caps, [cat]: Number.isFinite(n) && n >= 0 ? n : null }; emit(); }
  // ----- notes -----
  function setNotes(t) { state.notesDoc = t; emit(); }
  function toggleMdCheck(index, checked) {
    const lines = state.notesDoc.split("\n");
    lines[index] = lines[index].replace(/\[([ xX])\]/, () => `[${checked ? "x" : " "}]`);
    state.notesDoc = lines.join("\n"); emit();
  }
  // ----- prefs -----
  function setTheme(t) { state.theme = t; document.documentElement.setAttribute("data-theme", t); emit(); }
  function toggleTheme() { setTheme(state.theme === "dark" ? "light" : "dark"); }
  function setView(v) { state.view = v; state.drawerOpen = false; emit(); }
  function setMode(m) { state.mode = m; emit(); }
  function setDayFilter(d) { state.dayFilter = state.dayFilter === d ? null : d; emit(); }
  function clearDayFilter() { state.dayFilter = null; emit(); }
  function selectStop(id) { state.selectedStopId = id; if (id) state.detailTab = "About"; emit(); }
  function setDetailTab(t) { state.detailTab = t; emit(); }
  function setDrawer(o) { state.drawerOpen = o; emit(); }
  function setDisplayCurrency(c) { state.displayCurrency = c; emit(); }
  function setLedgerSort(key) {
    const dir = state.ledgerSort.key === key && state.ledgerSort.dir === "asc" ? "desc" : "asc";
    state.ledgerSort = { key, dir }; emit();
  }
  function toggleRow(id) {
    state.selectedRows = state.selectedRows.includes(id) ? state.selectedRows.filter((r) => r !== id) : [...state.selectedRows, id];
    emit();
  }
  function clearRows() { state.selectedRows = []; emit(); }
  function setPivotMode(m) { state.pivotMode = m; emit(); }
  function setBudgetTab(t) { state.budgetTab = t; emit(); }
  // ----- big structural ops -----
  function importTrip(obj) {
    const v = validateTripJson(obj);
    if (!v.ok) return { ok: false, error: v.error };
    snapshot();
    state.stops = obj.stops.map((s) => ({ id: uid("stop"), title: s.title, day: s.day, category: s.category, location: s.location || "", notes: s.notes || "", startTime: s.startTime || "", endTime: s.endTime || "" }));
    state.expenses = obj.expenses.map((x) => normalizeExpense(x));
    state.settled = {};
    state.selectedStopId = state.stops[0] ? state.stops[0].id : null;
    state.selectedRows = [];
    emit();
    return { ok: true };
  }
  function templateSeed() {
    snapshot();
    const extraStops = [
      { id: uid("stop"), title: "Iles de Lerins Ferry", day: "2025-07-07", category: "transport", location: "Cannes", startTime: "15:00", endTime: "15:40", notes: "" },
      { id: uid("stop"), title: "Villa Ephrussi Gardens", day: "2025-07-08", category: "sightseeing", location: "Saint-Jean-Cap-Ferrat", startTime: "16:00", endTime: "17:30", notes: "" },
    ];
    const extraExp = [
      normalizeExpense({ description: "Iles de Lerins ferry", amount: 16, currency: "EUR", day: "2025-07-07", category: "Transit", payer: "Chloe" }),
      normalizeExpense({ description: "Villa Ephrussi entry", amount: 19, currency: "EUR", day: "2025-07-08", category: "Activities", payer: "Ava" }),
    ];
    state.stops = [...state.stops, ...extraStops];
    state.expenses = [...state.expenses, ...extraExp];
    emit();
  }

  function defaultGallery(stop) {
    const kinds = [CAT_SCENE_SAFE(stop.category), "harbour", "beach", "village"];
    return kinds.map((kind, i) => ({ id: uid("gal"), kind, caption: `${stop.title} · view ${i + 1}` }));
  }
  function CAT_SCENE_SAFE(cat) {
    return ({ sightseeing: "museum", dining: "food", lodging: "hotel", transport: "harbour", other: "garden" })[cat] || "village";
  }
  function getGallery(stopId) {
    const stop = state.stops.find((x) => x.id === stopId);
    if (!stop) return [];
    if (!state.galleries[stopId]) {
      state.galleries = { ...state.galleries, [stopId]: defaultGallery(stop) };
    }
    return state.galleries[stopId];
  }
  function setGalleryCaption(stopId, itemId, caption) {
    snapshot();
    state.galleries = {
      ...state.galleries,
      [stopId]: (state.galleries[stopId] || []).map((it) => (it.id === itemId ? { ...it, caption } : it)),
    };
    emit();
  }
  function reorderGallery(stopId, itemId, dir) {
    snapshot();
    const arr = [...(state.galleries[stopId] || [])];
    const i = arr.findIndex((it) => it.id === itemId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    state.galleries = { ...state.galleries, [stopId]: arr };
    emit();
  }
  function reorderStop(id, toIndex) {
    snapshot();
    const stop = state.stops.find((x) => x.id === id);
    if (!stop) return;
    const dayStops = state.stops.filter((x) => x.day === stop.day);
    const others = state.stops.filter((x) => x.day !== stop.day);
    const from = dayStops.findIndex((x) => x.id === id);
    if (from < 0) return;
    const [moved] = dayStops.splice(from, 1);
    dayStops.splice(Math.max(0, Math.min(toIndex, dayStops.length)), 0, moved);
    state.stops = [...others, ...dayStops];
    emit();
  }
  function factoryReset() {
    snapshot();
    const s = seedState();
    Object.assign(state, s);
    state.settled = {}; state.selectedRows = []; state.selectedStopId = s.stops.find((x) => x.title === "Musee Picasso")?.id || s.stops[0].id;
    initial = deepClone(Object.fromEntries(UNDOABLE.map((k) => [k, state[k]])));
    emit();
  }
  // ----- undo / redo -----
  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(deepClone(Object.fromEntries(UNDOABLE.map((k) => [k, state[k]]))));
    const snap = undoStack.pop();
    Object.assign(state, deepClone(snap));
    emit();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(deepClone(Object.fromEntries(UNDOABLE.map((k) => [k, state[k]]))));
    const snap = redoStack.pop();
    Object.assign(state, deepClone(snap));
    emit();
  }

  // seed the initial selection to the Musee Picasso stop
  state.selectedStopId = state.stops.find((s) => s.title === "Musee Picasso")?.id || state.stops[0]?.id || null;

  return {
    state, subscribe, emit,
    addStop, updateStop, deleteStop, addExpense, updateExpense, deleteExpense,
    bulkRecategorize, bulkReassignDay, bulkDelete, toggleSettle,
    addCustomField, deleteCustomField, setCustomValue, setPacking, setCap, setNotes, toggleMdCheck,
    setTheme, toggleTheme, setView, setMode, setDayFilter, clearDayFilter, selectStop, setDetailTab,
    setDrawer, setDisplayCurrency, setLedgerSort, toggleRow, clearRows, setPivotMode, setBudgetTab,
    importTrip, templateSeed, factoryReset, undo, redo, canUndo, canRedo,
    getGallery, setGalleryCaption, reorderGallery, reorderStop,
  };
}
