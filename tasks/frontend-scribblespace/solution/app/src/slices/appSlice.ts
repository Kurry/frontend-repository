import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  AppState,
  Board,
  CanvasObject,
  CanvasViewState,
  ObjectType,
  ViewMode,
} from '../types';
import { STREAM_EVENTS, streamNotePosition } from '../streamEvents';

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return `obj-${Date.now().toString(36)}-${idCounter}`;
};

export interface NamedColor {
  hex: string;
  name: string;
}

export const NOTE_COLORS: NamedColor[] = [
  { hex: '#FFF9C4', name: 'butter yellow' },
  { hex: '#FFE0B2', name: 'peach' },
  { hex: '#FFCDD2', name: 'rose' },
  { hex: '#C8E6C9', name: 'mint' },
  { hex: '#BBDEFB', name: 'sky blue' },
  { hex: '#E1BEE7', name: 'lilac' },
];

export const SHAPE_COLORS: NamedColor[] = [
  { hex: '#6D5BD0', name: 'violet' },
  { hex: '#E0A030', name: 'amber' },
  { hex: '#3F9E6E', name: 'green' },
  { hex: '#D95563', name: 'coral' },
  { hex: '#3E7CB1', name: 'blue' },
  { hex: '#5A5F73', name: 'slate' },
];

const createDefaultBoard = (name = 'Board 1'): Board => ({
  id: generateId(),
  name,
  objects: [],
  connectors: [],
  nextZIndex: 1,
});

interface PersistedState {
  boards?: Board[];
  activeBoardId?: string;
  canvasView?: CanvasViewState;
  viewMode?: ViewMode;
  stream?: AppState['stream'];
}

const loadState = (): PersistedState => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem('scribblespace_state');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.boards && !Array.isArray(parsed.boards)) return {};
    return parsed;
  } catch {
    return {};
  }
};

const persisted = loadState();
const defaultBoard = createDefaultBoard();

const loadedBoards =
  persisted.boards && persisted.boards.length > 0 ? persisted.boards : [defaultBoard];

const loadedStream = persisted.stream;
const collapseStatus = (s: AppState['stream']['status']): AppState['stream']['status'] => {
  if (s === 'active' || s === 'replaying' || s === 'disconnected') return 'paused';
  return s;
};

const initialState: AppState = {
  boards: loadedBoards,
  activeBoardId:
    persisted.activeBoardId && loadedBoards.some(b => b.id === persisted.activeBoardId)
      ? persisted.activeBoardId
      : loadedBoards[0].id,
  selectedIds: [],
  activeTool: 'select',
  connectFromId: null,
  canvasView: persisted.canvasView || { panX: 0, panY: 0, zoom: 1 },
  searchQuery: '',
  searchMatchIds: [],
  showExport: false,
  showDeleteConfirm: false,
  boardDeleteId: null,
  viewMode: persisted.viewMode === 'outline' ? 'outline' : 'canvas',
  showLivePanel: false,
  stream: loadedStream
    ? {
        status: collapseStatus(loadedStream.status || 'idle'),
        appliedIds: Array.isArray(loadedStream.appliedIds) ? loadedStream.appliedIds : [],
        receivedIds: Array.isArray(loadedStream.receivedIds) ? loadedStream.receivedIds : [],
        missedIds: Array.isArray(loadedStream.missedIds) ? loadedStream.missedIds : [],
      }
    : { status: 'idle', appliedIds: [], receivedIds: [], missedIds: [] },
  statusMessage: { text: '', key: 0 },
  lastAddedId: null,
};

const announce = (state: AppState, text: string) => {
  state.statusMessage = { text, key: state.statusMessage.key + 1 };
};

const activeBoard = (state: AppState): Board | undefined =>
  state.boards.find(b => b.id === state.activeBoardId);

const recomputeMatches = (state: AppState) => {
  const board = activeBoard(state);
  const query = state.searchQuery.trim().toLowerCase();
  if (!board || !query) {
    state.searchMatchIds = [];
    return;
  }
  state.searchMatchIds = board.objects
    .filter(o => {
      if (o.type === 'note') return (o.text || '').toLowerCase().includes(query);
      if (o.type === 'flashcard') {
        return (
          (o.front || '').toLowerCase().includes(query) ||
          (o.back || '').toLowerCase().includes(query)
        );
      }
      return false;
    })
    .map(o => o.id);
};

const applyStreamEvent = (state: AppState, eventId: string) => {
  const event = STREAM_EVENTS.find(e => e.id === eventId);
  if (!event) return false;
  if (state.stream.appliedIds.includes(event.id)) return false;
  const board = activeBoard(state);
  if (!board) return false;
  const noteId = `live-${event.id}`;
  if (!board.objects.some(o => o.id === noteId)) {
    const pos = streamNotePosition(event.ts);
    board.objects.push({
      id: noteId,
      type: 'note',
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 130,
      zIndex: board.nextZIndex,
      color: NOTE_COLORS[(event.ts - 1) % NOTE_COLORS.length].hex,
      text: event.text,
    });
    board.nextZIndex += 1;
  }
  state.stream.appliedIds.push(event.id);
  if (!state.stream.receivedIds.includes(event.id)) {
    state.stream.receivedIds.push(event.id);
  }
  state.stream.missedIds = state.stream.missedIds.filter(id => id !== event.id);
  return true;
};

const unappliedEvents = (state: AppState) =>
  STREAM_EVENTS.filter(e => !state.stream.appliedIds.includes(e.id));

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Boards
    addBoard: state => {
      const board = createDefaultBoard(`Board ${state.boards.length + 1}`);
      state.boards.push(board);
      state.activeBoardId = board.id;
      state.selectedIds = [];
      state.connectFromId = null;
      state.canvasView = { panX: 0, panY: 0, zoom: 1 };
      state.searchQuery = '';
      state.searchMatchIds = [];
      announce(state, `Board added: ${board.name}`);
    },
    renameBoard: (state, action: PayloadAction<{ boardId: string; name: string }>) => {
      const board = state.boards.find(b => b.id === action.payload.boardId);
      const name = action.payload.name.trim();
      if (board && name) {
        board.name = name;
        announce(state, `Board renamed to ${name}`);
      }
    },
    requestDeleteBoard: (state, action: PayloadAction<string | null>) => {
      state.boardDeleteId = action.payload;
    },
    deleteBoard: (state, action: PayloadAction<string>) => {
      const idx = state.boards.findIndex(b => b.id === action.payload);
      if (idx === -1) return;
      state.boards.splice(idx, 1);
      if (state.boards.length === 0) {
        const fresh = createDefaultBoard();
        state.boards.push(fresh);
      }
      if (state.activeBoardId === action.payload) {
        state.activeBoardId = state.boards[Math.max(0, idx - 1)].id;
      }
      state.selectedIds = [];
      state.connectFromId = null;
      state.searchMatchIds = [];
      state.boardDeleteId = null;
      announce(state, 'Board deleted');
    },
    setActiveBoard: (state, action: PayloadAction<string>) => {
      if (state.activeBoardId === action.payload) return;
      state.activeBoardId = action.payload;
      state.selectedIds = [];
      state.connectFromId = null;
      state.canvasView = { panX: 0, panY: 0, zoom: 1 };
      recomputeMatches(state);
    },

    // Canvas view
    setCanvasView: (state, action: PayloadAction<CanvasViewState>) => {
      state.canvasView = action.payload;
    },
    panCanvas: (state, action: PayloadAction<{ dx: number; dy: number }>) => {
      state.canvasView.panX += action.payload.dx;
      state.canvasView.panY += action.payload.dy;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.canvasView.zoom = Math.max(0.25, Math.min(3, Math.round(action.payload * 100) / 100));
    },
    resetView: state => {
      state.canvasView = { panX: 0, panY: 0, zoom: 1 };
    },

    // Tool
    setTool: (state, action: PayloadAction<'select' | 'connect'>) => {
      state.activeTool = action.payload;
      state.connectFromId = null;
    },
    setConnectFrom: (state, action: PayloadAction<string | null>) => {
      state.connectFromId = action.payload;
    },

    // Selection
    selectOnly: (state, action: PayloadAction<string>) => {
      state.selectedIds = [action.payload];
    },
    toggleSelect: (state, action: PayloadAction<string>) => {
      if (state.selectedIds.includes(action.payload)) {
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
      } else {
        state.selectedIds.push(action.payload);
      }
    },
    selectAll: state => {
      const board = activeBoard(state);
      if (board) {
        state.selectedIds = board.objects.map(o => o.id);
        announce(state, `${board.objects.length} objects selected`);
      }
    },
    deselectAll: state => {
      state.selectedIds = [];
    },

    // Objects
    addObject: (
      state,
      action: PayloadAction<{ kind: ObjectType; x: number; y: number }>
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const { kind } = action.payload;
      let x = Math.round(action.payload.x);
      let y = Math.round(action.payload.y);
      // Offset so stacked objects stay individually selectable
      while (board.objects.some(o => Math.abs(o.x - x) < 16 && Math.abs(o.y - y) < 16)) {
        x += 28;
        y += 28;
      }
      const base = {
        id: generateId(),
        x,
        y,
        zIndex: board.nextZIndex,
      };
      board.nextZIndex += 1;
      let obj: CanvasObject;
      if (kind === 'note') {
        const count = board.objects.filter(o => o.type === 'note').length;
        obj = {
          ...base,
          type: 'note',
          width: 200,
          height: 150,
          color: NOTE_COLORS[count % NOTE_COLORS.length].hex,
          text: '',
        };
        announce(state, 'Note added');
      } else if (kind === 'flashcard') {
        obj = {
          ...base,
          type: 'flashcard',
          width: 230,
          height: 160,
          color: '#FFFFFF',
          front: '',
          back: '',
          flipped: false,
        };
        announce(state, 'Flashcard added');
      } else {
        const count = board.objects.filter(
          o => o.type === 'rectangle' || o.type === 'circle' || o.type === 'arrow'
        ).length;
        obj = {
          ...base,
          type: kind,
          width: kind === 'circle' ? 110 : 140,
          height: kind === 'circle' ? 110 : 90,
          color: SHAPE_COLORS[count % SHAPE_COLORS.length].hex,
        };
        announce(state, 'Shape added');
      }
      board.objects.push(obj);
      state.selectedIds = [obj.id];
      state.lastAddedId = obj.id;
      recomputeMatches(state);
    },
    updateObject: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<CanvasObject> }>
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const obj = board.objects.find(o => o.id === action.payload.id);
      if (obj) {
        Object.assign(obj, action.payload.updates);
      }
      if (
        'text' in action.payload.updates ||
        'front' in action.payload.updates ||
        'back' in action.payload.updates
      ) {
        recomputeMatches(state);
      }
    },
    moveObject: (state, action: PayloadAction<{ id: string; dx: number; dy: number }>) => {
      const board = activeBoard(state);
      const obj = board?.objects.find(o => o.id === action.payload.id);
      if (obj) {
        obj.x += action.payload.dx;
        obj.y += action.payload.dy;
      }
    },
    resizeObject: (state, action: PayloadAction<{ id: string; dw: number; dh: number }>) => {
      const board = activeBoard(state);
      const obj = board?.objects.find(o => o.id === action.payload.id);
      if (obj) {
        obj.width = Math.max(60, obj.width + action.payload.dw);
        obj.height = Math.max(50, obj.height + action.payload.dh);
      }
    },
    setShowDeleteConfirm: (state, action: PayloadAction<boolean>) => {
      state.showDeleteConfirm = action.payload;
    },
    deleteSelectedObjects: state => {
      const board = activeBoard(state);
      if (!board) return;
      const ids = new Set(state.selectedIds);
      const count = board.objects.filter(o => ids.has(o.id)).length;
      board.objects = board.objects.filter(o => !ids.has(o.id));
      board.connectors = board.connectors.filter(
        c => !ids.has(c.fromId) && !ids.has(c.toId)
      );
      state.selectedIds = [];
      state.connectFromId = null;
      state.showDeleteConfirm = false;
      recomputeMatches(state);
      announce(state, count === 1 ? '1 object deleted' : `${count} objects deleted`);
    },
    bringToFront: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      const obj = board?.objects.find(o => o.id === action.payload);
      if (board && obj) {
        obj.zIndex = board.nextZIndex;
        board.nextZIndex += 1;
        announce(state, 'Object moved to the front');
      }
    },
    sendToBack: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      const obj = board?.objects.find(o => o.id === action.payload);
      if (board && obj) {
        const minZ = Math.min(...board.objects.map(o => o.zIndex));
        obj.zIndex = minZ - 1;
        announce(state, 'Object moved to the back');
      }
    },

    // Connectors
    addConnector: (state, action: PayloadAction<{ fromId: string; toId: string }>) => {
      const board = activeBoard(state);
      state.connectFromId = null;
      if (!board) return;
      const { fromId, toId } = action.payload;
      const exists = board.connectors.some(
        c =>
          (c.fromId === fromId && c.toId === toId) ||
          (c.fromId === toId && c.toId === fromId)
      );
      if (exists) {
        announce(state, 'These objects are already connected');
        return;
      }
      board.connectors.push({ id: generateId(), fromId, toId });
      state.activeTool = 'select';
      announce(state, 'Connector added');
    },
    removeConnector: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      if (board) {
        board.connectors = board.connectors.filter(c => c.id !== action.payload);
        announce(state, 'Connector removed');
      }
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      recomputeMatches(state);
    },

    // Panels
    setShowExport: (state, action: PayloadAction<boolean>) => {
      state.showExport = action.payload;
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    setShowLivePanel: (state, action: PayloadAction<boolean>) => {
      state.showLivePanel = action.payload;
    },
    clearLastAdded: state => {
      state.lastAddedId = null;
    },
    postStatus: (state, action: PayloadAction<string>) => {
      announce(state, action.payload);
    },

    // Live event stream
    streamStart: state => {
      if (unappliedEvents(state).length === 0) {
        state.stream.status = 'caught-up';
        announce(state, 'All events already applied');
        return;
      }
      state.stream.status = 'active';
      announce(state, 'Stream active');
    },
    streamPause: state => {
      state.stream.status = 'paused';
      announce(state, 'Stream paused');
    },
    streamDisconnect: state => {
      state.stream.status = 'disconnected';
      announce(state, 'Stream disconnected');
    },
    streamTick: state => {
      if (state.stream.status === 'active') {
        const next = unappliedEvents(state)[0];
        if (next) {
          applyStreamEvent(state, next.id);
          announce(state, `Event ${next.ts} applied`);
        }
        if (unappliedEvents(state).length === 0) {
          state.stream.status = 'caught-up';
          announce(state, 'Caught up — all 12 events applied');
        }
      } else if (state.stream.status === 'disconnected') {
        const next = STREAM_EVENTS.find(
          e =>
            !state.stream.appliedIds.includes(e.id) &&
            !state.stream.receivedIds.includes(e.id) &&
            !state.stream.missedIds.includes(e.id)
        );
        if (next) {
          state.stream.missedIds.push(next.id);
        }
      }
    },
    streamDeliverOutOfOrder: state => {
      const pending = STREAM_EVENTS.filter(
        e =>
          !state.stream.appliedIds.includes(e.id) &&
          !state.stream.receivedIds.includes(e.id) &&
          !state.stream.missedIds.includes(e.id)
      );
      const offered = pending[1] || pending[0];
      if (!offered) {
        announce(state, 'No events left to deliver');
        return;
      }
      if (
        state.stream.receivedIds.includes(offered.id) ||
        state.stream.appliedIds.includes(offered.id)
      ) {
        announce(state, `Event ${offered.ts} already received — duplicate ignored`);
        return;
      }
      state.stream.receivedIds.push(offered.id);
      announce(state, `Event ${offered.ts} received out of order — select Reconnect to apply it`);
    },
    streamReconnect: state => {
      // Reconnect is the catch-up boundary: apply every still-missing event in
      // logical timestamp order. Stable IDs make repeated reconnects idempotent.
      const toApply = STREAM_EVENTS.filter(
        e => !state.stream.appliedIds.includes(e.id)
      ).sort((a, b) => a.ts - b.ts);
      let applied = 0;
      for (const event of toApply) {
        if (applyStreamEvent(state, event.id)) applied += 1;
      }
      state.stream.missedIds = [];
      state.stream.status = 'replaying';
      announce(
        state,
        applied === 0
          ? 'Already caught up — 0 events replayed'
          : applied === 1
            ? 'Replayed 1 event'
            : `Replayed ${applied} events`
      );
    },
    streamReconnectFinish: state => {
      if (state.stream.status === 'replaying') {
        state.stream.status = 'caught-up';
      }
    },
  },
});

export const {
  addBoard,
  renameBoard,
  requestDeleteBoard,
  deleteBoard,
  setActiveBoard,
  setCanvasView,
  panCanvas,
  setZoom,
  resetView,
  setTool,
  setConnectFrom,
  selectOnly,
  toggleSelect,
  selectAll,
  deselectAll,
  addObject,
  updateObject,
  moveObject,
  resizeObject,
  setShowDeleteConfirm,
  deleteSelectedObjects,
  bringToFront,
  sendToBack,
  addConnector,
  removeConnector,
  setSearchQuery,
  setShowExport,
  setViewMode,
  setShowLivePanel,
  clearLastAdded,
  postStatus,
  streamStart,
  streamPause,
  streamDisconnect,
  streamTick,
  streamDeliverOutOfOrder,
  streamReconnect,
  streamReconnectFinish,
} = appSlice.actions;

export default appSlice.reducer;
