const COLOR_NAMES = [
  { hex: "#ff0000", name: "Vermilion", note: "Traditional red" },
  { hex: "#00ff00", name: "Emerald", note: "Bright green" },
  { hex: "#0000ff", name: "Ultramarine", note: "Deep blue" },
  { hex: "#ffff00", name: "Chrome Yellow", note: "Bright yellow" },
  { hex: "#00ffff", name: "Cyan", note: "Aqua blue" },
  { hex: "#ff00ff", name: "Magenta", note: "Bright purple" },
  { hex: "#ffffff", name: "Lead White", note: "Pure white" },
  { hex: "#000000", name: "Ivory Black", note: "Deep black" },
  { hex: "#888888", name: "Payne's Gray", note: "Neutral gray" },
  { hex: "#8b4513", name: "Burnt Sienna", note: "Earthy brown" },
  { hex: "#cd853f", name: "Raw Umber", note: "Warm brown" },
  { hex: "#556b2f", name: "Olive Green", note: "Earthy green" },
  { hex: "#800000", name: "Alizarin Crimson", note: "Deep red" },
  { hex: "#4b0082", name: "Indigo", note: "Dark blue-purple" },
  { hex: "#ff8c00", name: "Cadmium Orange", note: "Bright orange" }
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function colorDistance(rgb1: { r: number, g: number, b: number }, rgb2: { r: number, g: number, b: number }) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

export function oaColorName(hex: string): { name: string; note: string } {
  const target = hexToRgb(hex);
  let closest = COLOR_NAMES[0];
  let minDistance = Infinity;

  for (const color of COLOR_NAMES) {
    const dist = colorDistance(target, hexToRgb(color.hex));
    if (dist < minDistance) {
      minDistance = dist;
      closest = color;
    }
  }

  return { name: closest.name, note: closest.note };
}
