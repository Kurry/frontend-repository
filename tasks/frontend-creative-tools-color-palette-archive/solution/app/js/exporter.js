// Export previews — compiled live from the shared store on every render.
// The archive JSON shape IS the palette API contract (palette-archive.v1).
import { fmtHex, slugify, renderMarkdown, escapeHtml } from './lib.js';

export const EXPORT_TABS = [
  { id: 'css', label: 'CSS vars' },
  { id: 'utility-theme', label: 'Utility theme' },
  { id: 'scss', label: 'SCSS map' },
  { id: 'json', label: 'Archive JSON' },
  { id: 'catalog', label: 'Catalog sheet' },
];

export function buildExportText(format, palettes) {
  const active = palettes.filter((p) => !p.archived);

  // For CSS/JS/SCSS formats, returning a comment string directly breaks parsing
  // if tools expect actual variables, but the instructions say "reflect an empty palettes array when empty".
  // The JSON format must return valid JSON empty state.
  if (active.length === 0) {
    if (format === 'css') return '/* The archive is empty — no palettes to export. */';
    if (format === 'utility-theme') return '// The archive is empty — no palettes to export.';
    if (format === 'scss') return '// The archive is empty — no palettes to export.';
  }

  if (format === 'css') return buildCss(active);
  if (format === 'utility-theme') return buildUtilityTheme(active);
  if (format === 'scss') return buildScss(active);
  return buildArchiveJson(active);
}

function paletteVars(p) {
  const slug = slugify(p.name) || 'untitled';
  return p.swatches.map((hex, i) => ({ prop: `--${slug}-${i + 1}`, hex: fmtHex(hex) }));
}

function buildCss(palettes) {
  const lines = [':root {'];
  for (const p of palettes) {
    lines.push(`  /* ${p.name} — ${p.artist}, ${p.period} */`);
    for (const v of paletteVars(p)) lines.push(`  ${v.prop}: ${v.hex};`);
  }
  lines.push('}');
  return lines.join('\n');
}

function buildUtilityTheme(palettes) {
  const lines = ['// Tailwind-style theme fragment — palette-archive.v1', 'module.exports = {', '  theme: {', '    extend: {', '      colors: {'];
  for (const p of palettes) {
    const slug = slugify(p.name) || 'untitled';
    lines.push(`        // ${p.name} — ${p.artist}`);
    lines.push(`        '${slug}': {`);
    p.swatches.forEach((hex, i) => {
      lines.push(`          ${i + 1}: '${fmtHex(hex)}',`);
    });
    lines.push('        },');
  }
  lines.push('      },', '    },', '  },', '};');
  return lines.join('\n');
}

function buildScss(palettes) {
  const lines = ['// SCSS colour map — palette-archive.v1', '$palettes: ('];
  for (const p of palettes) {
    const slug = slugify(p.name) || 'untitled';
    const hexes = p.swatches.map((h) => `'${fmtHex(h)}'`).join(', ');
    lines.push(`  '${slug}': (${hexes}), // ${p.name} — ${p.artist}`);
  }
  lines.push(');');
  return lines.join('\n');
}

export function buildArchiveJson(palettes) {
  const doc = {
    version: 'palette-archive.v1',
    palettes: palettes.map((p) => ({
      id: p.id,
      name: p.name,
      artist: p.artist,
      period: p.period,
      swatches: p.swatches.map(fmtHex),
      favorite: p.favorite === true,
      tags: [...p.tags],
      notes: p.notes || '',
      archived: p.archived === true,
    })),
  };
  return JSON.stringify(doc, null, 2);
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportFilename(format) {
  if (format === 'css') return 'palette-archive.css';
  if (format === 'utility-theme') return 'palette-theme.js';
  if (format === 'scss') return '_palette-archive.scss';
  return 'palette-archive.json';
}

// Printable catalog sheet: every non-archived palette, compiled live.
export function buildCatalogHtml(palettes) {
  const live = palettes.filter((p) => !p.archived);
  const items = live
    .map((p) => {
      const chips = p.swatches
        .map(
          (hex) =>
            `<span class="catalog-chip" style="background:${escapeHtml(fmtHex(hex))}"><span>${escapeHtml(fmtHex(hex))}</span></span>`
        )
        .join('');
      const tags = p.tags.length
        ? `<p class="catalog-tags">${p.tags.map((t) => escapeHtml(t)).join(' · ')}</p>`
        : '';
      const notes = p.notes && p.notes.trim()
        ? `<div class="catalog-notes">${renderMarkdown(p.notes)}</div>`
        : `<p class="catalog-notes-empty">No provenance notes recorded for this palette.</p>`;
      return `<article class="catalog-item">
        <header>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="catalog-byline">${escapeHtml(p.artist)} · ${escapeHtml(p.period)}${p.favorite ? ' · ★ featured' : ''}</p>
        </header>
        ${tags}
        <div class="catalog-chips">${chips}</div>
        ${notes}
      </article>`;
    })
    .join('');
  return `<div class="catalog-doc">
    <header class="catalog-head">
      <p class="catalog-brand">Object and Archive — o+a</p>
      <h2>Catalog sheet</h2>
      <p class="catalog-meta">${live.length} palette${live.length === 1 ? '' : 's'} · compiled ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · palette-archive.v1</p>
    </header>
    ${items || '<p class="catalog-empty">The archive is empty — nothing to catalogue yet.</p>'}
  </div>`;
}
