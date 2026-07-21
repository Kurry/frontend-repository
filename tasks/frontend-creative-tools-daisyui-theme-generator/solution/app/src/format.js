// Artifact serializers (CSS / JSON / Config), declared-theme contract
// validation, contrast math, and the #theme= hash codec.
import {
  COLOR_KEYS, RADIUS_VALUES, RADIUS_GROUPS, SIZE_VALUES, SIZE_KINDS,
  BORDER_VALUES, FONT_FAMILIES, FIELD_HEIGHT, SELECTOR_SIZE,
} from './data.js';

export const NAME_RE = /^[A-Za-z][A-Za-z0-9 _-]*$/;

export function slugOf(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, '-');
}

function fontCss(id) {
  const f = FONT_FAMILIES.find((x) => x.id === id) || FONT_FAMILIES[0];
  return f.css;
}

export function toCSS(theme) {
  const lines = [];
  lines.push(`[data-theme="${slugOf(theme.name)}"] {`);
  lines.push(`  color-scheme: ${theme.options.darkColorScheme ? 'dark' : 'light'};`);
  for (const key of COLOR_KEYS) lines.push(`  ${key}: ${theme.colors[key]};`);
  for (const g of RADIUS_GROUPS) lines.push(`  --radius-${g}: ${theme.radius[g]};`);
  lines.push(`  --size-field: ${FIELD_HEIGHT[theme.size.field]};`);
  lines.push(`  --size-selector: ${SELECTOR_SIZE[theme.size.selector]};`);
  lines.push(`  --border: ${theme.border};`);
  lines.push(`  --depth: ${theme.depth};`);
  lines.push(`  --noise: ${theme.noise};`);
  lines.push(`  --font: ${fontCss(theme.fontFamily)};`);
  lines.push('}');
  return lines.join('\n');
}

// The declared-theme request-body contract. The active theme record IS this object.
export function toJSON(theme) {
  return {
    name: slugOf(theme.name),
    colors: Object.fromEntries(COLOR_KEYS.map((k) => [k, theme.colors[k]])),
    radius: { box: theme.radius.box, field: theme.radius.field, selector: theme.radius.selector },
    size: { field: theme.size.field, selector: theme.size.selector },
    border: theme.border,
    effects: { depth: theme.depth === 1, noise: theme.noise === 1 },
    fontFamily: theme.fontFamily,
    options: {
      defaultTheme: !!theme.options.defaultTheme,
      defaultDarkTheme: !!theme.options.defaultDarkTheme,
      darkColorScheme: !!theme.options.darkColorScheme,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function toConfig(theme) {
  const slug = slugOf(theme.name);
  const entry = {
    'color-scheme': theme.options.darkColorScheme ? 'dark' : 'light',
  };
  for (const key of COLOR_KEYS) entry[key.replace(/^--color-/, '')] = theme.colors[key];
  entry['radius-box'] = theme.radius.box;
  entry['radius-field'] = theme.radius.field;
  entry['radius-selector'] = theme.radius.selector;
  entry['size-field'] = theme.size.field;
  entry['size-selector'] = theme.size.selector;
  entry['border'] = theme.border;
  entry['depth'] = theme.depth;
  entry['noise'] = theme.noise;
  entry['font'] = fontCss(theme.fontFamily);
  return JSON.stringify({ theme: slug, themes: { [slug]: entry } }, null, 2);
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Strict declared-theme field-contract validation. Returns { ok, theme?, errors[] }.
// Never touches app state — callers apply only when ok.
export function validateDeclaredTheme(text) {
  const errors = [];
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    return { ok: false, errors: [`Payload is not valid JSON: ${err.message}`] };
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return { ok: false, errors: ['Payload must be a JSON object matching the declared-theme contract'] };
  }
  const known = new Set(['name', 'colors', 'radius', 'size', 'border', 'effects', 'fontFamily', 'options', 'generatedAt']);
  for (const key of Object.keys(doc)) {
    if (!known.has(key)) errors.push(`Unexpected key '${key}' is not part of the declared-theme contract`);
  }
  if (typeof doc.name !== 'string' || !doc.name.trim()) {
    errors.push("name is required (a trimmed string of 2-30 characters)");
  } else {
    const t = doc.name.trim();
    if (t.length < 2 || t.length > 30) errors.push(`name must be 2-30 characters (got ${t.length})`);
    else if (!NAME_RE.test(t)) errors.push('name must use letters, numbers, spaces, hyphens, or underscores only');
  }
  const colors = {};
  if (typeof doc.colors !== 'object' || doc.colors === null || Array.isArray(doc.colors)) {
    errors.push('colors is required (object of #RRGGBB values keyed by CSS variable)');
  } else {
    for (const key of COLOR_KEYS) {
      const v = doc.colors[key];
      if (v === undefined) errors.push(`colors['${key}'] is required`);
      else if (typeof v !== 'string' || !HEX_RE.test(v)) errors.push(`colors['${key}'] must be a #RRGGBB hex color`);
      else colors[key] = v.toLowerCase();
    }
  }
  const radius = {};
  if (typeof doc.radius !== 'object' || doc.radius === null) {
    errors.push('radius is required (object with box, field, selector)');
  } else {
    for (const g of RADIUS_GROUPS) {
      if (!RADIUS_VALUES.includes(doc.radius[g])) errors.push(`radius.${g} must be one of ${RADIUS_VALUES.join(', ')}`);
      else radius[g] = doc.radius[g];
    }
  }
  const size = {};
  if (typeof doc.size !== 'object' || doc.size === null) {
    errors.push('size is required (object with field and selector)');
  } else {
    for (const k of SIZE_KINDS) {
      if (!SIZE_VALUES.includes(doc.size[k])) errors.push(`size.${k} must be one of ${SIZE_VALUES.join(', ')}`);
      else size[k] = doc.size[k];
    }
  }
  let border = '1px';
  if (!BORDER_VALUES.includes(doc.border)) errors.push(`border must be one of ${BORDER_VALUES.join(', ')}`);
  else border = doc.border;
  let depth = 1;
  let noise = 0;
  if (typeof doc.effects !== 'object' || doc.effects === null) {
    errors.push('effects is required (object with boolean depth and noise)');
  } else {
    if (typeof doc.effects.depth !== 'boolean') errors.push('effects.depth must be a boolean');
    else depth = doc.effects.depth ? 1 : 0;
    if (typeof doc.effects.noise !== 'boolean') errors.push('effects.noise must be a boolean');
    else noise = doc.effects.noise ? 1 : 0;
  }
  let fontFamily = 'outfit';
  if (!FONT_FAMILIES.some((f) => f.id === doc.fontFamily)) {
    errors.push(`fontFamily must be one of ${FONT_FAMILIES.map((f) => f.id).join(', ')}`);
  } else fontFamily = doc.fontFamily;
  const options = { defaultTheme: false, defaultDarkTheme: false, darkColorScheme: false };
  if (typeof doc.options !== 'object' || doc.options === null) {
    errors.push('options is required (object with defaultTheme, defaultDarkTheme, darkColorScheme)');
  } else {
    for (const k of Object.keys(options)) {
      if (typeof doc.options[k] !== 'boolean') errors.push(`options.${k} must be a boolean`);
      else options[k] = doc.options[k];
    }
    if (options.defaultDarkTheme && !options.darkColorScheme) {
      errors.push('options.darkColorScheme must be true when options.defaultDarkTheme is true');
    }
  }
  if (typeof doc.generatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(doc.generatedAt)) {
    errors.push('generatedAt is required (ISO-8601 datetime ending in Z)');
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    theme: { name: doc.name.trim(), colors, radius, size, border, depth, noise, fontFamily, options },
  };
}

// ---- contrast math -------------------------------------------------------
function luminance(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const chan = (shift) => {
    const v = ((n >> shift) & 255) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(16) + 0.7152 * chan(8) + 0.0722 * chan(0);
}

export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- #theme= hash codec (LZW + base64url) --------------------------------
function lzwEncode(str) {
  const dict = new Map();
  let size = 256;
  for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);
  let w = '';
  const out = [];
  for (const ch of str) {
    const wc = w + ch;
    if (dict.has(wc)) { w = wc; continue; }
    out.push(dict.get(w));
    dict.set(wc, size++);
    w = ch;
  }
  if (w) out.push(dict.get(w));
  const bytes = new Uint8Array(out.length * 2);
  out.forEach((code, i) => { bytes[i * 2] = (code >> 8) & 255; bytes[i * 2 + 1] = code & 255; });
  return bytes;
}

function lzwDecode(bytes) {
  const codes = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) codes.push((bytes[i] << 8) | bytes[i + 1]);
  const dict = [];
  for (let i = 0; i < 256; i++) dict[i] = String.fromCharCode(i);
  let size = 256;
  let w = String.fromCharCode(codes[0]);
  let result = w;
  for (let i = 1; i < codes.length; i++) {
    const code = codes[i];
    let entry;
    if (dict[code] !== undefined) entry = dict[code];
    else if (code === size) entry = w + w[0];
    else throw new Error('bad code');
    result += entry;
    dict[size++] = w + entry[0];
    w = entry;
  }
  return result;
}

function toB64url(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '==='.slice((b.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeThemeHash(theme) {
  const payload = JSON.stringify(toJSON(theme));
  return toB64url(lzwEncode(payload));
}

export function decodeThemeHash(enc) {
  try {
    const json = lzwDecode(fromB64url(enc));
    const res = validateDeclaredTheme(json);
    if (!res.ok) return null;
    return res.theme;
  } catch {
    return null;
  }
}
