// Colour maths, validation, markdown, and DOM utilities. Pure functions —
// the visible UI and the WebMCP handlers share every rule in this file.
import { COLOR_NAMES, PERIODS } from './data.js';

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function fmtHex(hex) {
  return String(hex || '').trim().toUpperCase();
}

export function isValidHex(hex) {
  return HEX_RE.test(String(hex || '').trim());
}

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

// WCAG relative luminance
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(hexA, hexB) {
  const la = luminance(hexA), lb = luminance(hexB);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isLight(hex) {
  return contrastRatio(hex, '#121210') > contrastRatio(hex, '#f9f8f2');
}

// Nomenclature ordering key: order by hue, with low-saturation / near-black
// colours bucketed to the end (deterministic; ties broken by hex upstream).
export function hueSortKey(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (s < 0.12 || l < 0.12) return 1000 + (1 - l) * 100;
  if (l > 0.93) return 1200 + l * 100;
  return h;
}

// Colour-vision simulation matrices (sRGB channel mixes).
const VISION_MATRICES = {
  protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
};

export function simulateVision(hex, mode) {
  const m = VISION_MATRICES[mode];
  if (!m) return fmtHex(hex);
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  );
}

// Nearest historical name from the bundled dataset (weighted RGB distance —
// deterministic for a given hex).
let nameCache = null;
export function nearestColorName(hex) {
  if (!nameCache) {
    nameCache = COLOR_NAMES.map((e) => ({ ...e, rgb: hexToRgb(e.hex) }));
  }
  const { r, g, b } = hexToRgb(hex);
  let best = nameCache[0], bestD = Infinity;
  for (const e of nameCache) {
    const dr = r - e.rgb.r, dg = g - e.rgb.g, db = b - e.rgb.b;
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (d < bestD) { bestD = d; best = e; }
  }
  return { name: best.name, note: best.note };
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- palette field contract (shared by UI form, import, and MCP) ----

export const TAG_MAX = 6;
export const TAG_LEN = 24;
export const NOTES_MAX = 2000;
export const NAME_MAX = 80;
export const SWATCH_MIN = 3;
export const SWATCH_MAX = 12;

export function parseTags(input) {
  return String(input || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

// Returns null when valid, or { field, message } naming the offending field.
export function validatePalette(fields, { requireId = false } = {}) {
  if (!fields || typeof fields !== 'object') {
    return { field: 'record', message: 'The palette record must be an object.' };
  }
  if (requireId && (typeof fields.id !== 'string' || fields.id.trim() === '')) {
    return { field: 'id', message: 'id is required and must be a non-empty string.' };
  }
  if (typeof fields.name !== 'string' || fields.name.trim() === '') {
    return { field: 'name', message: 'Name is required — give this palette a title.' };
  }
  if (fields.name.length > NAME_MAX) {
    return { field: 'name', message: `Name must be ${NAME_MAX} characters or fewer.` };
  }
  if (typeof fields.artist !== 'string' || fields.artist.trim() === '') {
    return { field: 'artist', message: 'Artist is required — credit the source work.' };
  }
  if (fields.artist.length > NAME_MAX) {
    return { field: 'artist', message: `Artist must be ${NAME_MAX} characters or fewer.` };
  }
  if (!PERIODS.includes(fields.period)) {
    return { field: 'period', message: 'Period must be one of the closed period list.' };
  }
  if (!Array.isArray(fields.swatches)) {
    return { field: 'swatches', message: 'Swatches must be an ordered array of hex strings.' };
  }
  if (fields.swatches.length < SWATCH_MIN) {
    return { field: 'swatches', message: `Add at least ${SWATCH_MIN} swatches (currently ${fields.swatches.length}).` };
  }
  if (fields.swatches.length > SWATCH_MAX) {
    return { field: 'swatches', message: `Remove swatches — the limit is ${SWATCH_MAX} (currently ${fields.swatches.length}).` };
  }
  for (let i = 0; i < fields.swatches.length; i++) {
    if (!isValidHex(fields.swatches[i])) {
      return { field: 'swatches', message: `Swatch ${i + 1} must be a six-digit hex with a leading #, like #B3342B.` };
    }
  }
  const tags = fields.tags ?? [];
  if (!Array.isArray(tags)) {
    return { field: 'tags', message: 'Tags must be an array of short strings.' };
  }
  if (tags.length > TAG_MAX) {
    return { field: 'tags', message: `Tags: keep to ${TAG_MAX} or fewer.` };
  }
  const seen = new Set();
  for (const t of tags) {
    if (typeof t !== 'string' || t.trim() === '' || t.trim().length > TAG_LEN || t !== t.toLowerCase()) {
      return { field: 'tags', message: `Tags: "${t}" must be a lowercase tag of 1–${TAG_LEN} characters.` };
    }
    if (seen.has(t)) {
      return { field: 'tags', message: `Tags: "${t}" appears twice — remove the duplicate.` };
    }
    seen.add(t);
  }
  const notes = fields.notes ?? '';
  if (typeof notes !== 'string' || notes.length > NOTES_MAX) {
    return { field: 'notes', message: `Notes must be a string of ${NOTES_MAX} characters or fewer.` };
  }
  if (fields.favorite !== undefined && typeof fields.favorite !== 'boolean') {
    return { field: 'favorite', message: 'Favorite must be true or false.' };
  }
  if (fields.archived !== undefined && typeof fields.archived !== 'boolean') {
    return { field: 'archived', message: 'Archived must be true or false.' };
  }
  return null;
}

// Full archive-document validation for import (same field contract).
export function validateArchive(doc) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return 'The import must be a JSON object.';
  }
  if (doc.version !== 'palette-archive.v1') {
    return 'version must be exactly "palette-archive.v1".';
  }
  if (!Array.isArray(doc.palettes)) {
    return 'palettes must be an array.';
  }
  for (let i = 0; i < doc.palettes.length; i++) {
    const p = doc.palettes[i];
    const err = validatePalette(p, { requireId: true });
    if (err) return `palettes[${i}].${err.field}: ${err.message}`;
  }
  return null;
}

// ---------- markdown (headings, bold, italic, unordered lists) --------------

export function renderMarkdown(src) {
  const text = String(src || '');
  if (!text.trim()) return '';
  const lines = escapeHtml(text).split(/\r?\n/);

  // Heading depths are normalised to the shallowest level present, then offset
  // so the first heading renders as <h4> beneath its container <h3>. This keeps
  // the document outline free of skips regardless of which depth the author used.
  let minLevel = 4;
  for (const raw of lines) {
    const m = raw.match(/^(#{1,3})\s+/);
    if (m) minLevel = Math.min(minLevel, m[1].length);
  }
  const base = 4; // sits under the container <h3>

  const out = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const hm = line.match(/^(#{1,3})\s+(.*)$/);
    if (hm) {
      closeList();
      const tag = `h${base + (hm[1].length - minLevel)}`;
      out.push(`<${tag}>${inline(hm[2])}</${tag}>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('');
}

function inline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// ---------- harmony analysis -------------------------------------------------

export function distinctHues(hexes) {
  const seen = new Set();
  const hues = [];
  for (const hex of hexes) {
    const k = fmtHex(hex);
    if (seen.has(k) || !isValidHex(k)) continue;
    const { s, l } = hexToHsl(k);
    if (s < 0.12 || l < 0.1 || l > 0.94) continue; // achromatic — no usable hue
    seen.add(k);
    hues.push(Math.round(hexToHsl(k).h));
  }
  // Dedupe near-identical hue degrees
  const unique = [];
  for (const h of hues) {
    if (!unique.some((u) => hueDistance(u, h) <= 6)) unique.push(h);
  }
  return unique;
}

export function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function classifyHarmony(hexes) {
  const hues = distinctHues(hexes);
  if (hues.length < 2) {
    return { hues, classification: 'Monochrome', detail: 'A single-hue (or achromatic) palette — no hue relationships to measure.' };
  }
  if (hues.length === 2) {
    const d = hueDistance(hues[0], hues[1]);
    if (d <= 45) return { hues, classification: 'Analogous', detail: 'Both hues sit close on the wheel — a neighbouring pair.' };
    if (Math.abs(d - 180) <= 30) return { hues, classification: 'Complementary', detail: 'The two hues sit opposite each other on the wheel.' };
    return { hues, classification: 'Mixed', detail: 'Two hues with no classic wheel relationship.' };
  }
  // pairwise distances
  const dists = [];
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) dists.push(hueDistance(hues[i], hues[j]));
  }
  const span = Math.max(...dists);
  if (span <= 60) return { hues, classification: 'Analogous', detail: 'All hues cluster within one sector of the wheel.' };
  if (hues.length === 3 && dists.every((d) => Math.abs(d - 120) <= 35)) {
    return { hues, classification: 'Triadic', detail: 'Three hues spaced roughly evenly around the wheel.' };
  }
  if (dists.some((d) => Math.abs(d - 180) <= 30)) {
    return { hues, classification: 'Complementary', detail: 'A dominant opposite pair anchors the palette.' };
  }
  return { hues, classification: 'Mixed', detail: 'Hue spacing follows no single classic scheme.' };
}

// ---------- DOM helpers -------------------------------------------------------

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let liveEl = null;
export function announce(message) {
  if (!liveEl) liveEl = document.getElementById('live-status');
  if (!liveEl) return;
  liveEl.textContent = '';
  // Force a fresh announcement even for repeated identical messages.
  requestAnimationFrame(() => { liveEl.textContent = message; });
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Overlay stack for Escape handling + focus traps.
export const overlayStack = [];

export function trapKeydown(event) {
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    top.onEscape();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusables = top.el.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const list = [...focusables].filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (list.length === 0) { event.preventDefault(); return; }
  const first = list[0], last = list[list.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !top.el.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !top.el.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

export function openOverlay(entry) {
  overlayStack.push(entry);
  document.documentElement.classList.add('has-overlay');
  if (entry.modal !== false) document.body.classList.add('has-modal');
}

export function closeOverlay(entry) {
  const i = overlayStack.indexOf(entry);
  if (i >= 0) overlayStack.splice(i, 1);
  if (overlayStack.length === 0) {
    document.documentElement.classList.remove('has-overlay');
  }
  if (entry.modal !== false && !overlayStack.some((e) => e.modal !== false)) {
    document.body.classList.remove('has-modal');
  }
}

export function isOverlayOpen() {
  return overlayStack.length > 0;
}
