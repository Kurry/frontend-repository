// Local Tailwind v4 plugin that emits `icon-[<prefix>--<name>]` mask-image
// utilities from the bundled `@iconify-json/<prefix>` Iconify data.
//
// Why local: the upstream `@iconify/tailwind` v1.x is a Tailwind *v3* plugin.
// Referencing its root from `@plugin "@iconify/tailwind"` makes v4 call the
// module namespace object as a function and crash the build; its v4-native
// `addDynamicIconSelectors` (matchComponents) does not fire for the
// arbitrary-value `icon-[...]` classes this app uses. This plugin reads the
// *same* Iconify JSON source (offline, no second icon set, no raw SVGs in
// markup) and emits concrete CSS via `addBase`, covering exactly the icon
// names that appear in the app source (including those composed in template
// strings). This satisfies the "Tabler icons via a Tailwind plugin, bundled
// locally" requirement without any network access.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import plugin from 'tailwindcss/plugin';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

function collectNames() {
  const names = new Set();
  // Scan both literal utilities and icon identifiers held in maps/template
  // expressions so dynamically selected status/social icons are emitted too.
  const re = /(tabler--[A-Za-z0-9_-]+)/g;
  const files = ['App.jsx', 'Board.jsx', 'ConfigStudio.jsx', 'EasterCanvas.jsx', 'ExportCenter.jsx', 'Terminal.jsx', 'forms.jsx', 'commands.js', 'index.css']
    .map((f) => path.join(here, f));
  for (const file of files) {
    let src = '';
    try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
    let m;
    while ((m = re.exec(src))) names.add(m[1]);
  }
  return [...names];
}

function loadSet(prefix) {
  const data = require(`@iconify-json/${prefix}/icons.json`);
  const aliases = data.aliases || {};
  const w = data.width || 24;
  const h = data.height || 24;
  const resolve = (name, depth = 0) => {
    if (depth > 4) return null;
    if (data.icons[name]) return data.icons[name];
    const a = aliases[name];
    if (a) return resolve(a.parent, depth + 1);
    return null;
  };
  return {
    svg(name) {
      const icon = resolve(name);
      if (!icon) return null;
      const iw = icon.width || w;
      const ih = icon.height || h;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iw} ${ih}" width="${iw}" height="${ih}">${icon.body}</svg>`;
    },
  };
}

function encode(svg) {
  return svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
}

function buildRules(names) {
  const byPrefix = new Map();
  for (const n of names) {
    const i = n.indexOf('--');
    const prefix = n.slice(0, i);
    const icon = n.slice(i + 2);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, { set: loadSet(prefix), icons: new Set() });
    byPrefix.get(prefix).icons.add(icon);
  }
  const rules = {};
  for (const [prefix, { set, icons }] of byPrefix) {
    for (const icon of icons) {
      const svg = set.svg(icon);
      if (!svg) {
        // eslint-disable-next-line no-console
        console.warn(`[iconify-icons] missing icon ${prefix}--${icon}`);
        continue;
      }
      const url = `url("data:image/svg+xml,${encode(svg)}")`;
      rules[`.icon-\\[${prefix}--${icon}\\]`] = {
        display: 'inline-block',
        'flex-shrink': '0',
        'vertical-align': '-0.125em',
        'background-color': 'currentColor',
        '-webkit-mask-image': url,
        'mask-image': url,
        '-webkit-mask-repeat': 'no-repeat',
        'mask-repeat': 'no-repeat',
        '-webkit-mask-position': 'center',
        'mask-position': 'center',
        '-webkit-mask-size': 'contain',
        'mask-size': 'contain',
      };
    }
  }
  return rules;
}

// addBase emits unconditionally (independent of Tailwind's source scanner),
// which matters because the icon names are composed dynamically in JSX.
export default plugin(({ addBase }) => {
  addBase(buildRules(collectNames()));
});
