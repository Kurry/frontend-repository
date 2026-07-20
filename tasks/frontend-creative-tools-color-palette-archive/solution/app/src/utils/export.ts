import type { ExportFormat, Palette } from '../store/types';

const slug = (n: string) => n.toLowerCase().replace(/\s+/g, '-');

// Mirrors the text each Export drawer format tab shows / copies, so both the
// UI and the WebMCP artifact_export/artifact_copy tools stay byte-identical.
export function buildExportText(format: ExportFormat, palettes: Palette[]): string {
  if (format === 'json') {
    return JSON.stringify({ version: 'palette-archive.v1', palettes }, null, 2);
  }
  if (format === 'css') {
    return `:root {\n${palettes.map(p => `  /* ${p.name} */\n${p.swatches.map((s, i) => `  --color-${slug(p.name)}-${(i + 1) * 100}: ${s.toLowerCase()};`).join('\n')}`).join('\n\n')}\n}`;
  }
  if (format === 'scss') {
    return `$palettes: (\n${palettes.map(p => `  "${slug(p.name)}": (\n${p.swatches.map((s, i) => `    ${(i + 1) * 100}: ${s.toLowerCase()},`).join('\n')}\n  ),`).join('\n')}\n);`;
  }
  // utility-theme
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${palettes.map(p => `        "${slug(p.name)}": {\n${p.swatches.map((s, i) => `          ${(i + 1) * 100}: "${s.toLowerCase()}",`).join('\n')}\n        },`).join('\n')}\n      }\n    }\n  }\n}`;
}
