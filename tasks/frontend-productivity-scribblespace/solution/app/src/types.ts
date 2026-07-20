export type ObjectType = 'note' | 'flashcard' | 'rectangle' | 'circle' | 'arrow';

export interface CanvasObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  // Note fields
  text?: string;
  // Flashcard fields
  front?: string;
  back?: string;
  flipped?: boolean;
}

export interface Connector {
  id: string;
  fromId: string;
  toId: string;
}

export interface Board {
  id: string;
  name: string;
  objects: CanvasObject[];
  connectors: Connector[];
  nextZIndex: number;
}

export interface CanvasViewState {
  panX: number;
  panY: number;
  zoom: number;
}

export type ToolType = 'select' | 'connect';
export type ViewMode = 'canvas' | 'outline';

export type StreamStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'disconnected'
  | 'replaying'
  | 'caught-up';

export interface StreamEvent {
  id: string;
  ts: number;
  text: string;
}

export interface StreamState {
  status: StreamStatus;
  appliedIds: string[];
  receivedIds: string[];
  missedIds: string[];
}

export interface StatusMessage {
  text: string;
  key: number;
}

export interface BoardHistoryState {
  boards: Board[];
  activeBoardId: string;
}

export interface AppState {
  boards: Board[];
  activeBoardId: string;
  archive: { id: string, boardId: string, obj: CanvasObject }[];
  selectedIds: string[];
  activeTool: ToolType;
  connectFromId: string | null;
  canvasView: CanvasViewState;
  searchQuery: string;
  searchMatchIds: string[];
  showExport: boolean;
  showDeleteConfirm: boolean;
  showArchivePanel: boolean;
  boardDeleteId: string | null;
  viewMode: ViewMode;
  showLivePanel: boolean;
  stream: StreamState;
  statusMessage: StatusMessage;
  lastAddedId: string | null;
  undoStack: BoardHistoryState[];
  redoStack: BoardHistoryState[];
}
