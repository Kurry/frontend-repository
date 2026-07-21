import { writable, derived, get } from 'svelte/store';
import type { ToolMode, MirrorMode, VisionMode, ActiveMode, SavedBoard, VersionSnapshot, CellValue, TagEnum } from './types';

// App settings
export const activeMode = writable<ActiveMode>('paint');
export const toolMode = writable<ToolMode>('qr');
export const activeColor = writable<string>('#000000');
export const showGrid = writable<boolean>(true);
export const cellSize = writable<number>(40);
export const cellLock = writable<boolean>(false);
export const mirrorMode = writable<MirrorMode>('off');
export const visionMode = writable<VisionMode>('off');
export const tagFilter = writable<string | null>(null);

// Transient paint-stage selection driven by the editor_select WebMCP tool and
// rendered as a ring on the canvas (same surface the canvas controls paint).
export const selectedCell = writable<{ r: number; c: number } | null>(null);

// Camera session chrome (toolbar overlay). Lifted into the store so the
// command-session WebMCP tools drive the exact same visible overlay as the
// on-toolbar Camera button. `cameraClosing` drives the fade-out transition.
export const cameraOpen = writable<boolean>(false);
export const cameraClosing = writable<boolean>(false);
export const cameraError = writable<string>('');

// Export center import dialog (modal). Driven by both the visible
// "Import Project" control and the artifact_import WebMCP tool.
export const importDialogOpen = writable<boolean>(false);

// Which Export center artifact a WebMCP artifact_export call last targeted, so
// the visible Export center can highlight the matching section.
export const exportFormat = writable<'project-json' | 'png' | 'css-palette'>('project-json');

// Transient toast feedback (save / copy / bulk actions) with entrance + fade.
export interface Toast { id: string; message: string; kind: 'success' | 'error' | 'info'; }
export const toasts = writable<Toast[]>([]);
export function pushToast(message: string, kind: Toast['kind'] = 'success') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts.update(t => [...t, { id, message, kind }]);
  setTimeout(() => toasts.update(t => t.filter(x => x.id !== id)), 2600);
}

// Shared gallery multi-select so the visible checkboxes and the entity_select /
// entity_toggle WebMCP tools mutate one collection.
export const selectedBoards = writable<Set<string>>(new Set());
export function toggleBoardSelection(id: string) {
  selectedBoards.update(set => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
}
export function setBoardSelection(ids: string[]) {
  selectedBoards.update(() => new Set(ids));
}
export function clearBoardSelection() {
  selectedBoards.update(() => new Set());
}

// Board state
export const createEmptyBoard = (size: number): CellValue[][] => {
  const cols = Math.floor(1024 / size);
  const rows = Math.floor(1024 / size);
  return Array.from({ length: rows }, () => Array(cols).fill(null));
};

// Both the old and new grids cover the same fixed 1024px stage, so a cell's
// pixel-space position can be reused to sample the nearest old cell — this
// preserves existing artwork when the grid re-tiles instead of wiping it.
export const resampleCells = (cells: CellValue[][], oldSize: number, newSize: number): CellValue[][] => {
  const oldRows = cells.length;
  const oldCols = oldRows > 0 ? cells[0].length : 0;
  if (oldRows === 0 || oldCols === 0) return createEmptyBoard(newSize);

  const newCols = Math.floor(1024 / newSize);
  const newRows = Math.floor(1024 / newSize);

  return Array.from({ length: newRows }, (_, r) =>
    Array.from({ length: newCols }, (_, c) => {
      const oldR = Math.min(oldRows - 1, Math.floor((r * newSize) / oldSize));
      const oldC = Math.min(oldCols - 1, Math.floor((c * newSize) / oldSize));
      const cell = cells[oldR]?.[oldC] ?? null;
      return cell ? { ...cell } : null;
    })
  );
};

export const boardCells = writable<CellValue[][]>(createEmptyBoard(40));

export const updateBoardSize = (newSize: number) => {
  if (get(cellLock)) return; // Don't change if locked
  const resampled = resampleCells(get(boardCells), get(cellSize), newSize);
  cellSize.set(newSize);
  boardCells.set(resampled);
};

// History state
export const undoStack = writable<CellValue[][][]>([]);
export const redoStack = writable<CellValue[][][]>([]);

export const pushHistory = (cells: CellValue[][]) => {
  const cloned = cells.map(row => row.map(c => (c ? { ...c } : null)));
  undoStack.update(stack => {
    const newStack = [...stack, cloned];
    if (newStack.length > 100) newStack.shift();
    return newStack;
  });
  redoStack.set([]);
  cellLock.set(true);
};

export const undo = () => {
  const u = get(undoStack);
  if (u.length === 0) return;
  const prev = u[u.length - 1];
  undoStack.set(u.slice(0, -1));
  redoStack.update(r => [...r, get(boardCells).map(row => row.map(c => (c ? { ...c } : null)))]);
  boardCells.set(prev);
};

export const redo = () => {
  const r = get(redoStack);
  if (r.length === 0) return;
  const next = r[r.length - 1];
  redoStack.set(r.slice(0, -1));
  undoStack.update(u => [...u, get(boardCells).map(row => row.map(c => (c ? { ...c } : null)))]);
  boardCells.set(next);
};

export const clearBoard = () => {
  const size = get(cellSize);
  pushHistory(get(boardCells));
  boardCells.set(createEmptyBoard(size));
  cellLock.set(false);
};

// Scrubbable undo timeline (bonus). `timelineIndex` is null while not
// scrubbing; otherwise it indexes into [undoStack..., currentBoard] and the
// canvas previews that historical frame live. Releasing the slider commits the
// chosen frame as the new head without discarding reachable states.
export const timelineIndex = writable<number | null>(null);
export const timelineLength = derived(undoStack, $u => $u.length + 1);

export function scrubTimeline(index: number | null) {
  if (index === null) { timelineIndex.set(null); return; }
  const frames = [...get(undoStack), get(boardCells).map(row => row.map(c => (c ? { ...c } : null)))];
  const clamped = Math.max(0, Math.min(frames.length - 1, index));
  timelineIndex.set(clamped);
  boardCells.set(frames[clamped]);
}

export function commitTimeline() {
  const idx = get(timelineIndex);
  if (idx === null) return;
  const frames = [...get(undoStack), get(boardCells).map(row => row.map(c => (c ? { ...c } : null)))];
  const clamped = Math.max(0, Math.min(frames.length - 1, idx));
  const newUndo = frames.slice(0, clamped).map(f => f.map(row => row.map(c => (c ? { ...c } : null))));
  const newRedo = frames.slice(clamped + 1).reverse().map(f => f.map(row => row.map(c => (c ? { ...c } : null))));
  undoStack.set(newUndo);
  redoStack.set(newRedo);
  boardCells.set(frames[clamped].map(row => row.map(c => (c ? { ...c } : null))));
  if (frames[clamped].some(row => row.some(c => c !== null))) cellLock.set(true);
  timelineIndex.set(null);
}

// The frame the canvas should currently show: a timeline preview while
// scrubbing, otherwise the live board.
export const displayCells = derived([boardCells, timelineIndex, undoStack], ([$b, $ti, $u]) => {
  if ($ti === null) return $b;
  const frames = [...$u, $b];
  return frames[Math.max(0, Math.min(frames.length - 1, $ti))] ?? $b;
});

// ---- Seeds: four non-blank boards so Gallery, load, and thumbnails are
// populated on first load (each with a distinct, recognizable pattern). ----
const SIZE = 40;
const DIM = Math.floor(1024 / SIZE);
const c = (color: string): CellValue => ({ kind: 'color', color });

function seedPattern(kind: number): CellValue[][] {
  const grid = createEmptyBoard(SIZE);
  for (let r = 0; r < DIM; r++) {
    for (let col = 0; col < DIM; col++) {
      let v: CellValue = null;
      if (kind === 0) {
        // Diagonal stripes: red / blue / blank
        const m = (r + col) % 3;
        v = m === 0 ? c('#ff0000') : m === 1 ? c('#0000ff') : null;
      } else if (kind === 1) {
        // Centered pink block (portrait silhouette) on black ground
        const cx = DIM / 2, cy = DIM / 2;
        const inFace = Math.abs(col - cx) <= 4 && Math.abs(r - cy) <= 6;
        v = inFace ? c('#ff0098') : c('#000000');
      } else if (kind === 2) {
        // Checker of green / yellow
        v = (r + col) % 2 === 0 ? c('#00ff00') : c('#ffff00');
      } else {
        // Blue plus/cross on white ground (logo mark)
        const cx = Math.floor(DIM / 2), cy = Math.floor(DIM / 2);
        const onCross = (Math.abs(col - cx) <= 2) || (Math.abs(r - cy) <= 2);
        v = onCross ? c('#0000ff') : null;
      }
      grid[r][col] = v;
    }
  }
  return grid;
}

const SEED_TAGS: TagEnum[] = ['pattern', 'portrait', 'abstract', 'logo'];
const SEED_NAMES = ['Pattern Alpha', 'Hero Portrait', 'Abstract Noise', 'App Logo'];
const SEED_BOARDS: SavedBoard[] = SEED_NAMES.map((name, i) => ({
  id: String(i + 1),
  name,
  tag: SEED_TAGS[i],
  favorite: i === 1,
  cells: seedPattern(i),
  cellSize: SIZE
}));

export const savedBoards = writable<SavedBoard[]>(SEED_BOARDS.map(b => ({ ...b, cells: b.cells.map(r => r.map(x => (x ? { ...x } : null))) })));
export const versions = writable<VersionSnapshot[]>([]);

export const visibleBoards = derived([savedBoards, tagFilter], ([$savedBoards, $tagFilter]) => {
  if (!$tagFilter) return $savedBoards;
  return $savedBoards.filter(b => b.tag === $tagFilter);
});

export const addBoard = (board: Omit<SavedBoard, 'id'>) => {
  savedBoards.update(boards => [...boards, { ...board, id: Date.now().toString() + Math.random().toString(36).slice(2, 6) }]);
};
export const updateBoard = (id: string, updates: Partial<SavedBoard>) => {
  savedBoards.update(boards => boards.map(b => b.id === id ? { ...b, ...updates } : b));
};
export const deleteBoard = (id: string) => {
  savedBoards.update(boards => boards.filter(b => b.id !== id));
  selectedBoards.update(set => { const n = new Set(set); n.delete(id); return n; });
};
export const clearAllBoards = () => {
  savedBoards.set([]);
  selectedBoards.set(new Set());
};

export const addVersion = (version: Omit<VersionSnapshot, 'id' | 'timestamp'>) => {
  versions.update(v => [...v, { ...version, id: Date.now().toString(), timestamp: Date.now() }]);
};

// Shared load: writes a saved board's cells onto the paint canvas, returns to
// Paint mode, and locks the Cell control because the canvas now holds artwork.
export function loadBoardToCanvas(board: SavedBoard) {
  cellSize.set(board.cellSize);
  boardCells.set(board.cells.map(row => row.map(x => (x ? { ...x } : null))));
  cellLock.set(true);
  activeMode.set('paint');
}
