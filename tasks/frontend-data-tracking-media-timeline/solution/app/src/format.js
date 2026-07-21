import { ERAS, CATEGORIES } from "./data";

// Unambiguous BCE/CE used everywhere (scrubber, pins, kicker, rows, markdown headings).
export function fmtYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return "";
  if (y < 0) return `${Math.abs(y)} BCE`;
  if (y === 0) return `1 BCE`;
  return `${y} CE`;
}

export function eraAtYear(year) {
  const y = Number(year);
  for (const era of ERAS) {
    if (y >= era.fromYear && y <= era.toYear) return era;
  }
  // fallback nearest
  return ERAS.find((e) => y <= e.toYear) || ERAS[ERAS.length - 1];
}

export function eraAtMidpoint(from, to) {
  return eraAtYear(Math.round((Number(from) + Number(to)) / 2));
}

function matchesSearch(ev, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    ev.title.toLowerCase().includes(s) ||
    ev.place.toLowerCase().includes(s) ||
    ev.summary.toLowerCase().includes(s)
  );
}

function matchesCategories(ev, enabled) {
  const set = new Set(enabled);
  return ev.categories.some((c) => set.has(c));
}

// Events matching category filters + search (the "catalogued" set), excluding leaving ids.
export function cataloguedEvents(events, enabledCategories, search, leaving) {
  const lv = leaving || new Set();
  return events.filter((ev) => !lv.has(ev.id) && matchesCategories(ev, enabledCategories) && matchesSearch(ev, search));
}

// Catalogued events also inside the year window (the "in view" set).
export function inViewEvents(events, enabledCategories, search, window, leaving) {
  const cat = cataloguedEvents(events, enabledCategories, search, leaving);
  const from = Number(window.from);
  const to = Number(window.to);
  return cat.filter((ev) => ev.year >= from && ev.year <= to);
}

export function sortByYear(list, sort) {
  const arr = list.slice();
  arr.sort((a, b) => (sort === "asc" ? a.year - b.year : b.year - a.year));
  return arr;
}

// Per-category tally of in-view events (an event with N enabled categories counts in each).
export function densityCounts(inView) {
  const counts = {};
  for (const c of CATEGORIES) counts[c.id] = 0;
  for (const ev of inView) {
    for (const c of ev.categories) {
      if (counts[c] !== undefined) counts[c] += 1;
    }
  }
  return counts;
}

function csvCell(value) {
  const s = String(value == null ? "" : value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildTimelineJSON(state) {
  return {
    version: 1,
    document: "media-timeline",
    window: { fromYear: state.window.from, toYear: state.window.to },
    enabledCategories: state.enabledCategories.slice(),
    eras: ERAS.map((e) => ({ name: e.name, fromYear: e.fromYear, toYear: e.toYear })),
    events: state.events.map((ev) => ({
      title: ev.title,
      type: ev.type,
      timestamp: ev.timestamp,
      mediaRefs: ev.mediaRefs.slice(),
      year: ev.year,
      place: ev.place,
      categories: ev.categories.slice(),
      summary: ev.summary,
      source: ev.source,
    })),
  };
}

export function buildEventsCSV(events) {
  const header = "title,type,timestamp,mediaRefs,year,place,categories,summary,source";
  const lines = events.map((ev) =>
    [
      csvCell(ev.title),
      csvCell(ev.type),
      csvCell(ev.timestamp),
      csvCell(ev.mediaRefs.join(";")),
      csvCell(ev.year),
      csvCell(ev.place),
      csvCell(ev.categories.join("|")),
      csvCell(ev.summary),
      csvCell(ev.source),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export function buildWindowMarkdown(state, inView) {
  const w = state.window;
  const lines = [];
  lines.push(`# Media Timeline — ${fmtYear(w.from)} to ${fmtYear(w.to)}`);
  lines.push("");
  lines.push(`Enabled categories: ${state.enabledCategories.join(", ")}`);
  lines.push("");
  lines.push(`Events in view: ${inView.length}`);
  lines.push("");
  for (const ev of inView) {
    lines.push(`- **${ev.title}** — ${ev.type}, ${fmtYear(ev.year)}`);
  }
  return lines.join("\n");
}

export const EXPORT_FORMATS = [
  { id: "timeline-json", label: "Timeline JSON", file: "timeline-pack.json", mime: "application/json" },
  { id: "events-csv", label: "Events CSV", file: "timeline-events.csv", mime: "text/csv" },
  { id: "window-markdown", label: "Window Markdown", file: "timeline-window.md", mime: "text/markdown" },
];
