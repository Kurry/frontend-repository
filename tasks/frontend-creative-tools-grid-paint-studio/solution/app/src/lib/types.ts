export type ToolMode = 'qr' | 'color' | 'fill' | 'erase';
export type MirrorMode = 'off' | 'horizontal' | 'vertical' | 'both';
export type VisionMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type ActiveMode = 'paint' | 'gallery' | 'export';
export type TagEnum = 'pattern' | 'portrait' | 'abstract' | 'logo' | 'study' | 'signal';

// A board cell is either blank (null), a flat solid-color fill, or a
// QR-glyph fill — both non-blank kinds carry the swatch color that was
// active when the cell was painted.
export type CellValue =
  | null
  | { kind: 'color'; color: string }
  | { kind: 'qr'; color: string };

export interface SavedBoard {
  id: string;
  name: string;
  tag: TagEnum;
  favorite: boolean;
  cells: CellValue[][];
  cellSize: number;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: number;
  cells: CellValue[][];
  cellSize: number;
}

export interface ProjectDocument {
  cellSize: number;
  tool: ToolMode;
  swatch: string;
  mirror: MirrorMode;
  vision: VisionMode;
  gridVisible: boolean;
  cells: CellValue[][];
  boards: SavedBoard[];
  versions: VersionSnapshot[];
}
