// Colour math shared by the swatch fields, the ATC contrast matrix, the
// Patch recipe / Theme CSS exports, and the colour-blindness simulation.

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isHex(value: string): boolean {
  return HEX_RE.test(value);
}

/** CSS hex for a 24-bit colour integer. */
export function css(n: number): string {
  return "#" + (n & 0xffffff).toString(16).padStart(6, "0");
}

/** 24-bit integer from a #RRGGBB string. */
export function hexToInt(hex: string): number {
  return parseInt(hex.replace(/^#/, ""), 16) & 0xffffff;
}

function channels(n: number): [number, number, number] {
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function pack(r: number, g: number, b: number): number {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (c(r) << 16) | (c(g) << 8) | c(b);
}

/** WCAG 2.x relative luminance of a 24-bit colour. */
export function luminance(n: number): number {
  const [r, g, b] = channels(n).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio (1..21) between two 24-bit colours. */
export function contrastRatio(a: number, b: number): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ColourBlindness = "none" | "protanopia" | "deuteranopia";

export const COLOUR_BLINDNESS_LABELS: Record<ColourBlindness, string> = {
  none: "None",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
};

// Brettel-style simulation matrices applied in gamma space — enough to make
// colour-vision risk immediately visible in the Preview panels.
const SIM: Record<Exclude<ColourBlindness, "none">, number[][]> = {
  protanopia: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
};

/** Rendered colour under a colour-blindness simulation (hex fields stay put). */
export function simulate(n: number, mode: ColourBlindness): number {
  if (mode === "none") return n & 0xffffff;
  const m = SIM[mode];
  const [r, g, b] = channels(n);
  return pack(
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  );
}
