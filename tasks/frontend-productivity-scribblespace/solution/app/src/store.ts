import { defineStore } from 'pinia';
import { type AppState, type Board, type CanvasObject, type Connector, type ObjectType, type ViewMode, type StreamEvent, type BoardHistoryState } from './types';
import { STREAM_EVENTS, streamNotePosition } from './streamEvents';

export const NOTE_COLORS = [
  { hex: '#FFF9C4', name: 'butter yellow' },
  { hex: '#FFE0B2', name: 'peach' },
  { hex: '#FFCDD2', name: 'rose' },
  { hex: '#C8E6C9', name: 'mint' },
  { hex: '#BBDEFB', name: 'sky blue' },
  { hex: '#E1BEE7', name: 'lilac' },
];

export const SHAPE_COLORS = [
  { hex: '#6D5BD0', name: 'violet' },
  { hex: '#E0A030', name: 'amber' },
  { hex: '#3F9E6E', name: 'green' },
  { hex: '#D95563', name: 'coral' },
  { hex: '#3E7CB1', name: 'blue' },
  { hex: '#5A5F73', name: 'slate' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultBoard = (id = 'b-1'): Board => ({
  id,
  name: 'Board 1',
  objects: [],
  connectors: [],
  nextZIndex: 1,
});

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    boards: [createDefaultBoard()],
    activeBoardId: 'b-1',
    archive: [],
    selectedIds: [],
    activeTool: 'select',
    connectFromId: null,
    canvasView: { panX: 0, panY: 0, zoom: 1 },
    searchQuery: '',
    searchMatchIds: [],
    showExport: false,
    showDeleteConfirm: false,
    showArchivePanel: false,
    boardDeleteId: null,
    viewMode: 'canvas',
    showLivePanel: false,
    stream: {
      status: 'idle',
      appliedIds: [],
      receivedIds: [],
      missedIds: [],
    },
    statusMessage: { text: 'Welcome to ScribbleSpace', key: 0 },
    lastAddedId: null,
    undoStack: [],
    redoStack: [],
  }),
  getters: {
    activeBoard: (state) => state.boards.find((b) => b.id === state.activeBoardId),
    unappliedEvents: (state) => STREAM_EVENTS.filter((e) => !state.stream.appliedIds.includes(e.id)).sort((a, b) => a.ts - b.ts),
    canUndo: (state) => state.undoStack.length > 0,
    canRedo: (state) => state.redoStack.length > 0,
  },
  actions: {
    announce(text: string) {
      this.statusMessage = { text, key: Date.now() };
    },

    _saveHistory() {
      const snapshot: BoardHistoryState = {
        boards: JSON.parse(JSON.stringify(this.boards)),
        activeBoardId: this.activeBoardId
      };
      this.undoStack.push(snapshot);
      this.redoStack = [];
    },

    undo() {
      if (this.undoStack.length === 0) return;
      const currentSnapshot: BoardHistoryState = {
        boards: JSON.parse(JSON.stringify(this.boards)),
        activeBoardId: this.activeBoardId
      };
      this.redoStack.push(currentSnapshot);
      const snapshot = this.undoStack.pop();
      if (snapshot) {
        this.boards = JSON.parse(JSON.stringify(snapshot.boards));
        this.activeBoardId = snapshot.activeBoardId;
        this.recomputeMatches();
        this.selectedIds = [];
        this.announce('Undo successful');
      }
    },

    redo() {
      if (this.redoStack.length === 0) return;
      const currentSnapshot: BoardHistoryState = {
        boards: JSON.parse(JSON.stringify(this.boards)),
        activeBoardId: this.activeBoardId
      };
      this.undoStack.push(currentSnapshot);
      const snapshot = this.redoStack.pop();
      if (snapshot) {
        this.boards = JSON.parse(JSON.stringify(snapshot.boards));
        this.activeBoardId = snapshot.activeBoardId;
        this.recomputeMatches();
        this.selectedIds = [];
        this.announce('Redo successful');
      }
    },

    addBoard() {
      this._saveHistory();
      const id = generateId();
      const count = this.boards.length + 1;
      this.boards.push({
        id,
        name: `Board ${count}`,
        objects: [],
        connectors: [],
        nextZIndex: 1,
      });
      this.activeBoardId = id;
      this.selectedIds = [];
      this.connectFromId = null;
      this.announce('New board created');
    },
    renameBoard(id: string, name: string) {
      const b = this.boards.find(b => b.id === id);
      if (b) {
        b.name = name;
        this.announce('Board renamed');
      }
    },
    requestDeleteBoard(id: string) {
      this.boardDeleteId = id;
    },
    deleteBoard() {
      if (!this.boardDeleteId) return;
      this._saveHistory();
      this.boards = this.boards.filter(b => b.id !== this.boardDeleteId);
      if (this.boards.length === 0) {
        const id = generateId();
        this.boards.push(createDefaultBoard(id));
        this.activeBoardId = id;
      } else if (this.activeBoardId === this.boardDeleteId) {
        this.activeBoardId = this.boards[this.boards.length - 1].id;
      }
      this.boardDeleteId = null;
      this.selectedIds = [];
      this.connectFromId = null;
      this.announce('Board deleted');
    },
    setActiveBoard(id: string) {
      this.activeBoardId = id;
      this.selectedIds = [];
      this.connectFromId = null;
      this.searchQuery = '';
      this.recomputeMatches();
      this.announce('Switched board');
    },

    setCanvasView(view: Partial<AppState['canvasView']>) {
      this.canvasView = { ...this.canvasView, ...view };
    },
    panCanvas({ dx, dy }: { dx: number, dy: number }) {
      this.canvasView.panX += dx;
      this.canvasView.panY += dy;
    },
    setZoom(zoom: number) {
      this.canvasView.zoom = Math.min(Math.max(zoom, 0.25), 3);
    },
    resetView() {
      this.canvasView = { panX: 0, panY: 0, zoom: 1 };
      this.announce('View reset');
    },
    setTool(tool: AppState['activeTool']) {
      this.activeTool = tool;
      if (tool !== 'connect') {
        this.connectFromId = null;
      }
    },
    setConnectFrom(id: string | null) {
      this.connectFromId = id;
    },

    selectOnly(id: string) {
      this.selectedIds = [id];
    },
    toggleSelect(id: string) {
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter((sel) => sel !== id);
      } else {
        this.selectedIds.push(id);
      }
    },
    selectAll() {
      const b = this.activeBoard;
      if (b) {
        this.selectedIds = b.objects.map(o => o.id);
        this.announce(`${this.selectedIds.length} objects selected`);
      }
    },
    deselectAll() {
      this.selectedIds = [];
    },

    addObject({ kind, x, y }: { kind: ObjectType, x: number, y: number }) {
      const board = this.activeBoard;
      if (!board) return;
      this._saveHistory();

      let bx = Math.round(x);
      let by = Math.round(y);
      while (board.objects.some(o => Math.abs(o.x - bx) < 16 && Math.abs(o.y - by) < 16)) {
        bx += 28;
        by += 28;
      }

      const base = {
        id: generateId(),
        x: bx,
        y: by,
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
        this.announce('Note added');
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
        this.announce('Flashcard added');
      } else {
        const count = board.objects.filter(o => o.type === 'rectangle' || o.type === 'circle' || o.type === 'arrow').length;
        obj = {
          ...base,
          type: kind,
          width: kind === 'circle' ? 110 : 140,
          height: kind === 'circle' ? 110 : 90,
          color: SHAPE_COLORS[count % SHAPE_COLORS.length].hex,
        };
        this.announce('Shape added');
      }

      board.objects.push(obj);
      this.selectedIds = [obj.id];
      this.lastAddedId = obj.id;
      this.recomputeMatches();
    },
    updateObject({ id, updates }: { id: string; updates: Partial<CanvasObject> }) {
      const board = this.activeBoard;
      if (!board) return;
      const obj = board.objects.find(o => o.id === id);
      if (obj) {
        if ('text' in updates || 'front' in updates || 'back' in updates) {
           this._saveHistory();
        } else {
           if ('color' in updates || 'flipped' in updates) {
               this._saveHistory();
           }
        }
        Object.assign(obj, updates);
      }
      if ('text' in updates || 'front' in updates || 'back' in updates) {
        this.recomputeMatches();
      }
    },
    moveObject({ id, dx, dy }: { id: string; dx: number; dy: number }) {
      const board = this.activeBoard;
      const obj = board?.objects.find(o => o.id === id);
      if (obj) {
        obj.x += dx;
        obj.y += dy;
      }
    },
    resizeObject({ id, dw, dh }: { id: string; dw: number; dh: number }) {
      const board = this.activeBoard;
      const obj = board?.objects.find(o => o.id === id);
      if (obj) {
        obj.width = Math.max(obj.type === 'note' || obj.type === 'flashcard' ? 120 : 48, obj.width + dw);
        obj.height = Math.max(obj.type === 'note' || obj.type === 'flashcard' ? 96 : 48, obj.height + dh);
      }
    },
    duplicateSelectedObjects() {
      const board = this.activeBoard;
      if (!board) return;
      this._saveHistory();
      const ids = new Set(this.selectedIds);
      const toDuplicate = board.objects.filter(o => ids.has(o.id));
      const newSelectedIds: string[] = [];
      toDuplicate.forEach(obj => {
        const cloned = { ...obj, id: generateId(), x: obj.x + 28, y: obj.y + 28, zIndex: board.nextZIndex++ };
        board.objects.push(cloned);
        newSelectedIds.push(cloned.id);
      });
      this.selectedIds = newSelectedIds;
      this.announce(`Duplicated ${toDuplicate.length} objects`);
    },
    setShowDeleteConfirm(show: boolean) {
      this.showDeleteConfirm = show;
    },
    deleteSelectedObjects() {
      const board = this.activeBoard;
      if (!board) return;
      this._saveHistory();
      const ids = new Set(this.selectedIds);
      const toArchive = board.objects.filter(o => ids.has(o.id));
      toArchive.forEach(obj => {
         this.archive.push({ id: generateId(), boardId: board.id, obj: JSON.parse(JSON.stringify(obj)) });
      });

      const count = toArchive.length;
      board.objects = board.objects.filter(o => !ids.has(o.id));
      board.connectors = board.connectors.filter(c => !ids.has(c.fromId) && !ids.has(c.toId));
      this.selectedIds = [];
      this.connectFromId = null;
      this.showDeleteConfirm = false;
      this.recomputeMatches();
      this.announce(count === 1 ? '1 object deleted' : `${count} objects deleted`);
    },
    archiveSelectedObjects() {
       this.deleteSelectedObjects();
    },
    restoreFromArchive(id: string) {
      this._saveHistory();
      const index = this.archive.findIndex(a => a.id === id);
      if (index === -1) return;
      const item = this.archive[index];
      this.archive.splice(index, 1);
      const board = this.boards.find(b => b.id === item.boardId);
      if (board) {
         board.objects.push(item.obj);
         this.recomputeMatches();
         this.announce('Object restored');
      } else {
         const active = this.activeBoard;
         if (active) {
            active.objects.push(item.obj);
            this.recomputeMatches();
            this.announce('Object restored');
         }
      }
    },
    purgeFromArchive(id: string) {
      this.archive = this.archive.filter(a => a.id !== id);
      this.announce('Object purged');
    },
    bringToFront(id: string) {
      const board = this.activeBoard;
      const obj = board?.objects.find(o => o.id === id);
      if (board && obj) {
        this._saveHistory();
        obj.zIndex = board.nextZIndex++;
        this.announce('Object moved to the front');
      }
    },
    sendToBack(id: string) {
      const board = this.activeBoard;
      const obj = board?.objects.find(o => o.id === id);
      if (board && obj) {
        this._saveHistory();
        const minZ = Math.min(...board.objects.map(o => o.zIndex));
        obj.zIndex = minZ - 1;
        this.announce('Object moved to the back');
      }
    },

    addConnector({ fromId, toId }: { fromId: string; toId: string }) {
      const board = this.activeBoard;
      this.connectFromId = null;
      if (!board) return;
      const exists = board.connectors.some(
        c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId)
      );
      if (exists) {
        this.announce('These objects are already connected');
        return;
      }
      this._saveHistory();
      board.connectors.push({ id: generateId(), fromId, toId });
      this.activeTool = 'select';
      this.announce('Connector added');
    },
    removeConnector(id: string) {
      const board = this.activeBoard;
      if (board) {
        this._saveHistory();
        board.connectors = board.connectors.filter(c => c.id !== id);
        this.announce('Connector removed');
      }
    },

    setSearchQuery(q: string) {
      this.searchQuery = q;
      this.recomputeMatches();
    },
    recomputeMatches() {
      if (!this.searchQuery.trim()) {
        this.searchMatchIds = [];
        return;
      }
      const board = this.activeBoard;
      if (!board) return;
      const q = this.searchQuery.toLowerCase();
      this.searchMatchIds = board.objects.filter(o => {
        if (o.type === 'note' && o.text?.toLowerCase().includes(q)) return true;
        if (o.type === 'flashcard' && (o.front?.toLowerCase().includes(q) || o.back?.toLowerCase().includes(q))) return true;
        return false;
      }).map(o => o.id);
    },

    setShowExport(show: boolean) {
      this.showExport = show;
    },
    setViewMode(mode: ViewMode) {
      this.viewMode = mode;
    },
    setShowLivePanel(show: boolean) {
      this.showLivePanel = show;
    },
    setShowArchivePanel(show: boolean) {
      this.showArchivePanel = show;
    },
    clearLastAdded() {
      this.lastAddedId = null;
    },
    postStatus(msg: string) {
      this.announce(msg);
    },

    applyStreamEvent(id: string) {
      const board = this.activeBoard;
      if (!board) return false;
      const event = STREAM_EVENTS.find(e => e.id === id);
      if (!event) return false;
      if (!board.objects.find(o => o.id === event.id)) {
        this._saveHistory();
        const pos = streamNotePosition(event.ts);
        board.objects.push({
          id: event.id,
          type: 'note',
          x: pos.x,
          y: pos.y,
          width: 200,
          height: 150,
          zIndex: board.nextZIndex++,
          color: NOTE_COLORS[(event.ts - 1) % NOTE_COLORS.length].hex,
          text: event.text,
        });
      }
      this.stream.appliedIds.push(event.id);
      if (!this.stream.receivedIds.includes(event.id)) {
        this.stream.receivedIds.push(event.id);
      }
      this.stream.missedIds = this.stream.missedIds.filter(mid => mid !== event.id);
      return true;
    },
    streamStart() {
      if (this.unappliedEvents.length === 0) {
        this.stream.status = 'caught-up';
        this.announce('All events already applied');
        return;
      }
      this.stream.status = 'active';
      this.announce('Stream active');
    },
    streamPause() {
      this.stream.status = 'paused';
      this.announce('Stream paused');
    },
    streamDisconnect() {
      this.stream.status = 'disconnected';
      this.announce('Stream disconnected');
    },
    streamTick() {
      if (this.stream.status === 'active') {
        const next = this.unappliedEvents[0];
        if (next) {
          this.applyStreamEvent(next.id);
          this.announce(`Event ${next.ts} applied`);
        }
        if (this.unappliedEvents.length === 0) {
          this.stream.status = 'caught-up';
          this.announce('Caught up — all 12 events applied');
        }
      } else if (this.stream.status === 'disconnected') {
        const next = STREAM_EVENTS.find(
          e =>
            !this.stream.appliedIds.includes(e.id) &&
            !this.stream.receivedIds.includes(e.id) &&
            !this.stream.missedIds.includes(e.id)
        );
        if (next) {
          this.stream.missedIds.push(next.id);
        }
      }
    },
    streamDeliverOutOfOrder() {
      const pending = STREAM_EVENTS.filter(
        e =>
          !this.stream.appliedIds.includes(e.id) &&
          !this.stream.receivedIds.includes(e.id) &&
          !this.stream.missedIds.includes(e.id)
      );
      const offered = pending[1] || pending[0];
      if (!offered) {
        this.announce('No events left to deliver');
        return;
      }
      if (this.stream.receivedIds.includes(offered.id) || this.stream.appliedIds.includes(offered.id)) {
        this.announce(`Event ${offered.ts} already received — duplicate ignored`);
        return;
      }
      this.stream.receivedIds.push(offered.id);
      this.announce(`Event ${offered.ts} received out of order — select Reconnect to apply it`);
    },
    streamReconnect() {
      const toApply = STREAM_EVENTS.filter(e => !this.stream.appliedIds.includes(e.id)).sort((a, b) => a.ts - b.ts);
      let applied = 0;
      for (const event of toApply) {
        if (this.applyStreamEvent(event.id)) applied += 1;
      }
      this.stream.missedIds = [];
      this.stream.status = 'replaying';
      this.announce(
        applied === 0
          ? 'Already caught up — 0 events replayed'
          : applied === 1
          ? 'Replayed 1 event'
          : `Replayed ${applied} events`
      );
    },
    streamReconnectFinish() {
      if (this.stream.status === 'replaying') {
        this.stream.status = 'caught-up';
      }
    },
    setFullState(workspace: any) {
       this._saveHistory();
       this.boards = workspace.boards;
       this.activeBoardId = workspace.activeBoardId;
       this.selectedIds = [];
       this.connectFromId = null;
       this.announce('Workspace imported');
    }
  }
});
