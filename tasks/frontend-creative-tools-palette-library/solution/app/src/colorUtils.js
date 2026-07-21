// Color math shared across the O&A Palette Library.

export function normalizeHex(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h.toUpperCase();
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  const to = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  return {
    r: hueToRgb(p, q, hk + 1 / 3) * 255,
    g: hueToRgb(p, q, hk) * 255,
    b: hueToRgb(p, q, hk - 1 / 3) * 255,
  };
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** Shift hue (degrees, wraps), saturation and lightness (clamped 0-100). */
export function shiftHex(hex, dh = 0, ds = 0, dl = 0) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h + dh, s + ds, l + dl);
}

/** WCAG relative luminance. */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const chan = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Perceived-luminance (YIQ) text color: ink on light tiles, cream on dark tiles. */
export function textOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? 'rgba(33,26,18,0.88)' : 'rgba(250,246,234,0.94)';
}

/** Sort key: hue wheel order; desaturated / very dark colors park after the chromatic run by lightness. */
export function hueSortValue(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (s < 12 || l < 10) return 1000 + (100 - l);
  return h;
}

// Viénot 1999 dichromacy simulation matrices (linear RGB).
const CVD_MATRICES = {
  Protanopia: [
    [0.1124, 0.8876, 0],
    [0.1124, 0.8876, 0],
    [0.004, -0.004, 1],
  ],
  Deuteranopia: [
    [0.2927, 0.7073, 0],
    [0.2927, 0.7073, 0],
    [-0.0223, 0.0223, 1],
  ],
};

function srgbToLinear(v) {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v) {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(c * 255)));
}

/** Simulated color-vision-deficient rendering of a hex, for vision-simulation mode. */
export function simulateVision(hex, mode) {
  const m = CVD_MATRICES[mode];
  if (!m) return normalizeHexToHex(hex);
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return rgbToHex(
    linearToSrgb(m[0][0] * lr + m[0][1] * lg + m[0][2] * lb),
    linearToSrgb(m[1][0] * lr + m[1][1] * lg + m[1][2] * lb),
    linearToSrgb(m[2][0] * lr + m[2][1] * lg + m[2][2] * lb),
  );
}

export function normalizeHexToHex(hex) {
  return `#${normalizeHex(hex)}`;
}

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'palette';
}

export function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

/** Fixed saturation/lightness used to derive wheel colors from the anchor hue. */
export const ANCHOR_SAT = 62;
export const ANCHOR_LIGHT = 46;

/** Companion hue offsets from the anchor for each harmony mode. */
export const HARMONY_OFFSETS = {
  Analogous: [-30, -15, 15, 30],
  Complementary: [180],
  Triadic: [120, 240],
};

export function harmonyHues(anchorHue, mode) {
  const offsets = HARMONY_OFFSETS[mode] || HARMONY_OFFSETS.Analogous;
  return [anchorHue, ...offsets.map((o) => wrapHue(anchorHue + o))];
}
