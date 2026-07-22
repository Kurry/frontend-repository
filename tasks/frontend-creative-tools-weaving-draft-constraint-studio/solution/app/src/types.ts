export type Shaft = 0 | 1 | 2 | 3;
export type Treadle = 0 | 1 | 2 | 3;

export const MAX_ENDS = 64;
export const MAX_PICKS = 96;
export const FIXTURE_ENDS = 24;
export const FIXTURE_PICKS = 32;

export type YarnColor = "white" | "black" | "red" | "yellow" | "green" | "blue" | "pink";
export const FIXTURE_YARN_LOTS: YarnColor[] = ["white", "black", "red", "yellow", "green", "blue"];

export type ThreadingArray = (Shaft | null)[];
export type TreadlingArray = (Treadle | null)[];
export type TieUpMatrix = boolean[][];

export interface WeavingDraftProject {
  schemaVersion: "weaving-draft-project/v1";
  dimensions: { ends: number, picks: number };
  threading: ThreadingArray;
  tieUp: TieUpMatrix;
  treadling: TreadlingArray;
  warpColors: YarnColor[];
  weftColors: YarnColor[];
  repeats: RepeatDef[];
  variants: Variant[];
  activeVariantId: string | null;
  history: HistoryEvent[];
  approvedHash: string | null;
  exportedAt: string | null;
  simulation: SimulationState | null;
}

export interface SimulationState {
  currentPick: number;
  events: any[];
}

export interface RepeatDef {
  id: string;
  type: "threading" | "treadling" | "color";
  start: number;
  end: number;
  operation: "tile" | "mirror" | "rotate" | "offset";
}

export interface Variant {
  id: string;
  name: string;
  threading: ThreadingArray;
  tieUp: TieUpMatrix;
  treadling: TreadlingArray;
  warpColors: YarnColor[];
  weftColors: YarnColor[];
}

export interface HistoryEvent {
  action: string;
  payload: any;
}

export interface ValidationFinding {
  type: "float_warp" | "float_weft" | "empty_treadle" | "unused_shaft" | "duplicate_pick";
  message: string;
  cells: { x: number, y: number }[];
}
