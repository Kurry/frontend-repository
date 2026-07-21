import { buildPalettePackage } from '../paletteSchema';
import { slugify } from '../colorUtils';

/**
 * Export artifact text — the single source of truth shared by the visible
 * Export drawer preview and the WebMCP artifact tools, so agents and users
 * always get the same artifact shape.
 *
 * CSS contract: one `:root` block declaring a `--swatch-N` custom property per
 * exported swatch (numbered across the whole library so names never collide),
 * with a comment naming each palette above its group.
 */
export function artifactText(palettes, format) {
  if (format === 'css') {
    let out = '/* O&A Palette Library — exported CSS custom properties */\n:root {\n';
    let n = 0;
    for (const p of palettes) {
      out += `\n  /* ${p.name} — ${p.period} */\n`;
      for (const hex of p.swatches) {
        n += 1;
        out += `  --swatch-${n}: ${hex};\n`;
      }
    }
    out += '}\n';
    return out;
  }
  if (format === 'utility-theme') {
    let out = '// O&A Palette Library — theme.extend.colors\nexport const theme = {\n  extend: {\n    colors: {\n';
    for (const p of palettes) {
      out += `      '${slugify(p.name)}': [${p.swatches.map((s) => `'${s}'`).join(', ')}], // ${p.name}\n`;
    }
    out += '    },\n  },\n};\n';
    return out;
  }
  if (format === 'scss') {
    let out = '// O&A Palette Library — $palettes map\n$palettes: (\n';
    for (const p of palettes) {
      out += `  '${slugify(p.name)}': (${p.swatches.join(', ')}), // ${p.name}\n`;
    }
    out += ');\n';
    return out;
  }
  return JSON.stringify(buildPalettePackage(palettes), null, 2);
}
