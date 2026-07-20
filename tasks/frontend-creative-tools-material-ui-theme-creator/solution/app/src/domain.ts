import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types — the ThemeOptions shape and the API-shaped Theme package record
// ---------------------------------------------------------------------------
export type PaletteType = 'light' | 'dark';
export const INTENTS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
export type Intent = (typeof INTENTS)[number];

export interface ThemeOptions {
  palette: {
    type: PaletteType;
    primary: { main: string };
    secondary: { main: string };
    error: { main: string };
    warning: { main: string };
    info: { main: string };
    success: { main: string };
    background: { default: string; paper: string };
    text: { primary: string; secondary: string };
    divider: string;
  };
  typography: { fontFamily: string; fontSize: number };
  shape: { borderRadius: number };
}

export interface ThemePackage {
  name: string;
  paletteType: PaletteType;
  themeOptions: ThemeOptions;
}

export interface Snapshot {
  name: string;
  themeOptions: ThemeOptions;
}

export interface SavedTheme {
  id: string;
  name: string;
  paletteType: PaletteType;
  themeOptions: ThemeOptions;
  snapshots: Snapshot[];
}

// ---------------------------------------------------------------------------
// Zod schemas — the single source of truth for the field contract. Every form
// (New Theme, rename, Snapshot, Import) and the export/import shape validate
// against these, always naming the offending field.
// ---------------------------------------------------------------------------
export const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .regex(HEX, `${field} must be a #RRGGBB hex color`);

const intentSchema = (name: string) =>
  z.object({ main: hex(`${name}.main`) }).passthrough();

export const themeOptionsSchema = z.object({
  palette: z
    .object({
      type: z.enum(['light', 'dark'], {
        errorMap: () => ({ message: 'palette.type must be exactly light or dark' })
      }),
      primary: intentSchema('primary'),
      secondary: intentSchema('secondary'),
      error: intentSchema('error'),
      warning: intentSchema('warning'),
      info: intentSchema('info'),
      success: intentSchema('success'),
      background: z
        .object({ default: hex('background.default'), paper: hex('background.paper') })
        .partial()
        .optional(),
      text: z
        .object({ primary: hex('text.primary'), secondary: hex('text.secondary') })
        .partial()
        .optional(),
      divider: hex('divider').optional()
    })
    .passthrough(),
  typography: z
    .object({
      fontFamily: z.string().min(1, 'fontFamily must not be empty').optional(),
      fontSize: z
        .number({ invalid_type_error: 'fontSize must be a number' })
        .min(10, 'fontSize must be from 10 to 24')
        .max(24, 'fontSize must be from 10 to 24')
        .optional()
    })
    .partial()
    .optional(),
  shape: z.object({
    borderRadius: z
      .number({
        required_error: 'shape.borderRadius is required',
        invalid_type_error: 'shape.borderRadius must be a number'
      })
      .min(0, 'shape.borderRadius must be from 0 to 24')
      .max(24, 'shape.borderRadius must be from 0 to 24')
  })
});

export const themePackageSchema = themeOptionsSchema
  ? z
      .object({
        name: z
          .string({ required_error: 'name is required' })
          .trim()
          .min(1, 'name is required')
          .max(64, 'name must be at most 64 characters'),
        paletteType: z.enum(['light', 'dark'], {
          errorMap: () => ({ message: 'paletteType must be exactly light or dark' })
        }),
        themeOptions: themeOptionsSchema
      })
      .superRefine((val, ctx) => {
        if (val.themeOptions?.palette?.type !== val.paletteType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['themeOptions', 'palette', 'type'],
            message: 'themeOptions.palette.type must equal paletteType'
          });
        }
      })
  : (null as never);

// First zod error, naming the offending field path without stuttering it
export function firstError(err: z.ZodError): { path: string; message: string } {
  const issue = err.issues[0];
  const path = issue.path.join('.');
  const raw = issue.message;
  const message = path && !raw.toLowerCase().includes(path.toLowerCase()) ? `${path}: ${raw}` : raw;
  return { path, message };
}

// ---------------------------------------------------------------------------
// Harmony guidance — suggests a more distinct secondary when primary and
// secondary are tonally close (linked primary/secondary suggestion).
// ---------------------------------------------------------------------------
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(rp)}${to(gp)}${to(bp)}`;
}

export interface HarmonySuggestion {
  color: string;
  note: string;
}
export function suggestSecondary(primary: string, secondary: string): HarmonySuggestion | null {
  if (!HEX.test(primary) || !HEX.test(secondary)) return null;
  const ratio = contrastRatio(primary, secondary);
  if (ratio >= 2.2) return null; // already distinct enough
  const p = hexToHsl(primary);
  const s = hexToHsl(secondary);
  // push the secondary's hue away from primary and nudge lightness for tonal separation
  const hueShift = s.h - p.h;
  const dir = Math.abs(hueShift) > 180 ? (hueShift < 0 ? 1 : -1) : hueShift >= 0 ? 1 : -1;
  const candidates: Array<{ h: number; s: number; l: number; note: string }> = [
    { h: p.h + 150 * dir, s: Math.max(0.45, s.s), l: p.l > 0.5 ? 0.35 : 0.68, note: 'a hue-shifted accent away from primary' },
    { h: p.h + 30 * dir, s: Math.max(0.5, s.s), l: p.l > 0.5 ? 0.3 : 0.72, note: 'an adjacent-tone accent with tonal contrast' },
    { h: s.h, s: s.s, l: p.l > 0.5 ? 0.28 : 0.75, note: 'a tonal step away from primary' }
  ];
  for (const c of candidates) {
    const hexC = hslToHex(c.h, c.s, c.l);
    if (HEX.test(hexC) && contrastRatio(primary, hexC) >= 2.2) {
      return { color: hexC, note: `Try ${c.note}` };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Defaults, presets, seeds
// ---------------------------------------------------------------------------
export function defaultOptions(type: PaletteType = 'light'): ThemeOptions {
  const dark = type === 'dark';
  return {
    palette: {
      type,
      primary: { main: '#3f51b5' },
      secondary: { main: '#f50057' },
      error: { main: '#f44336' },
      warning: { main: '#ff9800' },
      info: { main: '#2196f3' },
      success: { main: '#4caf50' },
      background: {
        default: dark ? '#121212' : '#fafafa',
        paper: dark ? '#1e1e1e' : '#ffffff'
      },
      text: {
        primary: dark ? '#ffffff' : '#212121',
        secondary: dark ? '#b0b0b0' : '#616161'
      },
      divider: dark ? '#2c2c2c' : '#e0e0e0'
    },
    typography: { fontFamily: 'Roboto', fontSize: 14 },
    shape: { borderRadius: 4 }
  };
}

export interface Preset {
  id: string;
  name: string;
  type?: PaletteType;
  tokens: Partial<Record<Intent, string>> & {
    background?: { default?: string; paper?: string };
    text?: { primary?: string; secondary?: string };
    divider?: string;
  };
}

export const PRESETS: Preset[] = [
  {
    id: 'material-blue',
    name: 'Material Blue',
    type: 'light',
    tokens: {
      primary: '#1976d2',
      secondary: '#dc004e',
      error: '#d32f2f',
      warning: '#ed6c02',
      info: '#0288d1',
      success: '#2e7d32',
      background: { default: '#fafafa', paper: '#ffffff' },
      divider: '#e0e0e0'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'dark',
    tokens: {
      primary: '#00bcd4',
      secondary: '#80deea',
      error: '#ef5350',
      warning: '#ffb74d',
      info: '#4dd0e1',
      success: '#26a69a',
      background: { default: '#06232e', paper: '#0b3948' },
      text: { primary: '#e0f7fa', secondary: '#80deea' },
      divider: '#124a5c'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'light',
    tokens: {
      primary: '#2e7d32',
      secondary: '#8d6e63',
      error: '#c62828',
      warning: '#f9a825',
      info: '#0277bd',
      success: '#388e3c',
      background: { default: '#f1f8e9', paper: '#ffffff' },
      divider: '#c5e1a5'
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    type: 'dark',
    tokens: {
      primary: '#ffff00',
      secondary: '#00ffff',
      error: '#ff5252',
      warning: '#ffab00',
      info: '#40c4ff',
      success: '#69f0ae',
      background: { default: '#000000', paper: '#0a0a0a' },
      text: { primary: '#ffffff', secondary: '#e0e0e0' },
      divider: '#ffffff'
    }
  }
];

export function applyPreset(options: ThemeOptions, preset: Preset): ThemeOptions {
  const next = structuredClone(options);
  if (preset.type) next.palette.type = preset.type;
  for (const intent of INTENTS) {
    const c = preset.tokens[intent];
    if (c) next.palette[intent].main = c;
  }
  if (preset.tokens.background) {
    next.palette.background = { ...next.palette.background, ...preset.tokens.background };
  }
  if (preset.tokens.text) {
    next.palette.text = { ...next.palette.text, ...preset.tokens.text };
  }
  if (preset.tokens.divider) next.palette.divider = preset.tokens.divider;
  return next;
}

export function seedThemes(): SavedTheme[] {
  const blue = defaultOptions('light');
  const midnight = applyPreset(defaultOptions('dark'), PRESETS[1]);
  midnight.palette.type = 'dark';
  const evening = applyPreset(defaultOptions('light'), PRESETS[2]);
  return [
    { id: 'seed-1', name: 'Material Baseline', paletteType: 'light', themeOptions: blue, snapshots: [] },
    { id: 'seed-2', name: 'Ocean Midnight', paletteType: 'dark', themeOptions: midnight, snapshots: [] },
    { id: 'seed-3', name: 'Forest Daylight', paletteType: 'light', themeOptions: evening, snapshots: [] }
  ];
}

// ---------------------------------------------------------------------------
// Contrast (WCAG relative luminance)
// ---------------------------------------------------------------------------
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function luminance(hex: string): number {
  const m = HEX.exec(hex);
  if (!m) return 0;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
export type ContrastLevel = 'AAA' | 'AA' | 'Fail';
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}
export interface ContrastRow {
  id: string;
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  level: ContrastLevel;
}
export function contrastMatrix(o: ThemeOptions): ContrastRow[] {
  const bg = o.palette.background?.default ?? (o.palette.type === 'dark' ? '#121212' : '#fafafa');
  const primaryContrast = luminance(o.palette.primary.main) > 0.4 ? '#000000' : '#ffffff';
  const pairs: Array<[string, string, string, string]> = [
    ['primary-on-background', 'primary on background', o.palette.primary.main, bg],
    ['secondary-on-background', 'secondary on background', o.palette.secondary.main, bg],
    ['text-on-background', 'text on background', o.palette.text?.primary ?? '#212121', bg],
    ['primary-on-primary-contrast', 'primary on primary contrast', o.palette.primary.main, primaryContrast]
  ];
  return pairs.map(([id, label, fg, b]) => {
    const ratio = contrastRatio(fg, b);
    return { id, label, fg, bg: b, ratio: Math.round(ratio * 100) / 100, level: contrastLevel(ratio) };
  });
}

// ---------------------------------------------------------------------------
// Export artifacts — JSON theme package + CSS custom properties
// ---------------------------------------------------------------------------
export function toThemePackage(name: string, o: ThemeOptions): ThemePackage {
  return { name, paletteType: o.palette.type, themeOptions: o };
}

export function exportJSON(name: string, o: ThemeOptions): string {
  return JSON.stringify(toThemePackage(name, o), null, 2);
}

export function exportCSS(o: ThemeOptions): string {
  const p = o.palette;
  const lines = [
    ':root {',
    `  --mui-palette-type: ${p.type};`,
    `  --mui-palette-primary-main: ${p.primary.main};`,
    `  --mui-palette-secondary-main: ${p.secondary.main};`,
    `  --mui-palette-error-main: ${p.error.main};`,
    `  --mui-palette-warning-main: ${p.warning.main};`,
    `  --mui-palette-info-main: ${p.info.main};`,
    `  --mui-palette-success-main: ${p.success.main};`,
    `  --mui-palette-background-default: ${p.background?.default ?? ''};`,
    `  --mui-palette-background-paper: ${p.background?.paper ?? ''};`,
    `  --mui-palette-text-primary: ${p.text?.primary ?? ''};`,
    `  --mui-palette-text-secondary: ${p.text?.secondary ?? ''};`,
    `  --mui-palette-divider: ${p.divider ?? ''};`,
    `  --mui-typography-font-family: ${o.typography?.fontFamily ?? 'Roboto'};`,
    `  --mui-typography-font-size: ${o.typography?.fontSize ?? 14}px;`,
    `  --mui-shape-border-radius: ${o.shape.borderRadius}px;`,
    '}'
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Editor source (TypeScript createTheme options) <-> options
// ---------------------------------------------------------------------------
export function optionsToSource(o: ThemeOptions): string {
  return `import { createTheme } from '@mui/material/styles';\n\nexport const themeOptions = ${JSON.stringify(o, null, 2)};\n\nexport default createTheme(themeOptions);\n`;
}

// Extract the balanced { ... } literal following "themeOptions =" using brace
// counting (string- and comment-aware), so nested closers mid-object — or a
// stray "}" inside a // or /* */ comment — are never mistaken for the end of
// the literal.
function extractObjectLiteral(src: string): string | null {
  const anchor = /themeOptions\s*=\s*/.exec(src);
  const from = anchor ? anchor.index + anchor[0].length : 0;
  const start = src.indexOf('{', from);
  if (start === -1) return null;
  let depth = 0;
  let inStr: string | null = null;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    // Skip line and block comments so braces inside them don't count.
    if (ch === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i + 2);
      if (nl === -1) break;
      i = nl;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

// Parse the source pane back into ThemeOptions. Tolerant of the createTheme
// wrapper and of comments/extra statements around the literal.
export function sourceToOptions(src: string): { ok: true; options: ThemeOptions } | { ok: false; error: string } {
  try {
    let jsonLike = extractObjectLiteral(src);
    if (!jsonLike) {
      const start = src.indexOf('{');
      const end = src.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return { ok: false, error: 'No theme options object found' };
      jsonLike = src.slice(start, end + 1);
    }
    // eslint-disable-next-line no-new-func
    const obj = Function(`"use strict";return (${jsonLike});`)();
    const parsed = themeOptionsSchema.safeParse(obj);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error).message };
    return { ok: true, options: obj as ThemeOptions };
  } catch (e: any) {
    return { ok: false, error: e?.message ? `Syntax error: ${e.message}` : 'Invalid source' };
  }
}
