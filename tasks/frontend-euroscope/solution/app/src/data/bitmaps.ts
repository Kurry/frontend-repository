// Seeded sample of the embedded bitmaps a real EuroScope.exe carries. Upstream
// reads these out of the uploaded binary via the wasm parser; this rebuild is
// self-contained, so it ships a representative sample (ids taken from the
// upstream pub/bitmap/vector set) so the workflow is non-empty on first load.

export type Bitmap = {
  id: number;
  width: number;
  height: number;
  bpp: number;
  glyph: string; // 24x24 path, drawn for the "Vector" icon set
};

export const BITMAPS: Bitmap[] = [
  { id: 266, width: 16, height: 16, bpp: 32, glyph: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6 3.3v.1l-6 3.4-6-3.4v-.1l6-3.3Z" },
  { id: 267, width: 16, height: 16, bpp: 32, glyph: "M11 5h2v6h-2V5Zm0 8h2v2h-2v-2Z" },
  { id: 272, width: 24, height: 24, bpp: 32, glyph: "M3 5h18v2H3V5Zm0 6h18v2H3v-2Zm0 6h18v2H3v-2Z" },
  { id: 273, width: 24, height: 24, bpp: 32, glyph: "M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3Z" },
  { id: 298, width: 32, height: 32, bpp: 32, glyph: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4 5 3v6l-5 3-5-3V9l5-3Z" },
  { id: 299, width: 32, height: 32, bpp: 32, glyph: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" },
  { id: 306, width: 24, height: 24, bpp: 32, glyph: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v5l4 2-.8 1.6L11 13V7h2Z" },
  { id: 307, width: 24, height: 24, bpp: 32, glyph: "M4 12l6 6L20 4l-1.6-1.4L10 14.6 5.4 10 4 12Z" },
  { id: 313, width: 48, height: 48, bpp: 32, glyph: "M12 2 2 7l10 5 10-5-10-5Zm-8 8.5v4L12 19l8-4.5v-4L12 15l-8-4.5Z" },
  { id: 170, width: 48, height: 48, bpp: 32, glyph: "M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm12.5 0L21 18.5 15.5 21 13 15.5 15.5 13Z" },
];

export type IconSet = "none" | "vector";

export const ICON_SET_LABELS: Record<IconSet, string> = {
  none: "None (keep as-is)",
  vector: "Vector",
};
