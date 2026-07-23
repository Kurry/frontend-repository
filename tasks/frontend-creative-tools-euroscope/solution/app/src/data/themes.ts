// Colour vocabulary preserved verbatim from the upstream custom-euroscope
// patcher (src/page/Page2.tsx). Six source colours map to six named swatch
// roles. The named palettes keep the upstream character while assigning a
// distinct value to every role so selecting a set replaces all six swatches.

export const SWATCH_LABELS = [
  "Backdrop darkest",
  "Backdrop darker",
  "Backdrop main",
  "Backdrop lighter",
  "Backdrop lightest",
  "Foreground secondary",
] as const;

export type ThemeName = "EuroScope" | "Grey" | "Primer" | "Ayu" | "Solarised";

export const THEME_ORDER: ThemeName[] = [
  "EuroScope",
  "Grey",
  "Primer",
  "Ayu",
  "Solarised",
];

export const THEMES: Record<ThemeName, number[]> = {
  EuroScope: [0x05221c, 0x083028, 0x0b4136, 0x105f4f, 0x7d9a94, 0xff8040],
  Grey: [0x000000, 0x131313, 0x262626, 0x4b4b4b, 0x6d6d6d, 0xd4d4d4],
  Primer: [0x0d1117, 0x161b22, 0x21262d, 0x30363d, 0x484f58, 0x388bfd],
  Ayu: [0x0f1419, 0x14191f, 0x191f26, 0x314559, 0x5c6773, 0x39afd7],
  Solarised: [0x000000, 0x002b36, 0x073642, 0x586e75, 0x657b83, 0xb58900],
};

export { css, hexToInt } from "./colour";
