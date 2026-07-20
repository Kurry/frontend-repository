export type Period =
  | "Abstract + Geometric"
  | "Americana"
  | "Baroque to Neoclassical"
  | "Expressionism"
  | "Fauvism"
  | "Impressionism"
  | "Medieval"
  | "Modern"
  | "Old Masters"
  | "Post-Impressionism"
  | "Primitive + Folk"
  | "Realism"
  | "Romanticism"
  | "Symbolism"
  | "Tonalism";

export interface Palette {
  id: string;
  name: string;
  artist: string;
  period: Period;
  swatches: string[];
  favorite: boolean;
  tags?: string[];
  notes?: string;
  archived?: boolean;
}

export type ViewMode = 'nomenclature' | 'palette' | 'swatch';
export type SortMode = 'name-asc' | 'name-desc';
export type ExportFormat = 'css' | 'utility-theme' | 'scss' | 'json';
export type VisionSimulation = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface AppState {
  palettes: Palette[];
  activeView: ViewMode;
  periodFilter: Period | '';
  nameSort: SortMode;
  selectionId: string | null;
  multiSelect: Set<string>;
  undoStack: Palette[][];
  redoStack: Palette[][];
  visionSimulation: VisionSimulation;
  copyFeedback: string | null;
  exportPreviewText: string;
  importFeedback: string | null;
  searchText: string;
  tagFacet: string | null;
  archivedFacet: boolean;
  comparisonSelection: string[];
  catalogSheetContent: any;
  popupDismissed: boolean;
}
