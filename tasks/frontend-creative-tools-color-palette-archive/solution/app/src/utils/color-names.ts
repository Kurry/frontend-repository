import COLOR_NAMES_DATA from "../../data/color-names.json";

// Bundled historical color-name dataset: each entry is
// [hex-without-hash, name, note].
type ColorNameEntry = [string, string, string];

const COLOR_NAMES = COLOR_NAMES_DATA as ColorNameEntry[];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

export function oaColorName(hex: string): { name: string; note: string } {
  const target = hexToRgb(hex);
  if (!target || COLOR_NAMES.length === 0) return { name: "", note: "" };

  let closest = COLOR_NAMES[0];
  let minDistance = Infinity;

  for (const entry of COLOR_NAMES) {
    const rgb = hexToRgb(entry[0]);
    if (!rgb) continue;
    const dist =
      (target.r - rgb.r) * (target.r - rgb.r) +
      (target.g - rgb.g) * (target.g - rgb.g) +
      (target.b - rgb.b) * (target.b - rgb.b);
    if (dist < minDistance) {
      minDistance = dist;
      closest = entry;
    }
  }

  return { name: closest[1], note: closest[2] };
}
