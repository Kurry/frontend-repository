export type ToolMode = 'qr' | 'color' | 'fill' | 'erase';
export type MirrorMode = 'off' | 'horizontal' | 'vertical' | 'both';
export type VisionMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type ActiveMode = 'paint' | 'gallery' | 'export';
export type TagEnum = 'pattern' | 'portrait' | 'abstract' | 'logo' | 'study' | 'signal';

export interface SavedBoard {
  id: string;
  name: string;
  tag: TagEnum;
  favorite: boolean;
  cells: (string | null)[][];
  cellSize: number;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: number;
  cells: (string | null)[][];
  cellSize: number;
}

export interface ProjectDocument {
  cellSize: number;
  tool: ToolMode;
  swatch: string;
  mirror: MirrorMode;
  vision: VisionMode;
  gridVisible: boolean;
  cells: (string | null)[][];
  boards: SavedBoard[];
  versions: VersionSnapshot[];
}
