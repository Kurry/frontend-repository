import { writable, derived, get } from 'svelte/store';
import type { ToolMode, MirrorMode, VisionMode, ActiveMode, SavedBoard, VersionSnapshot } from './types';

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

// Board state
const createEmptyBoard = (size: number): (string | null)[][] => {
  const cols = Math.floor(1024 / size);
  const rows = Math.floor(1024 / size);
  return Array.from({ length: rows }, () => Array(cols).fill(null));
};

export const boardCells = writable<(string | null)[][]>(createEmptyBoard(40));

export const updateBoardSize = (newSize: number) => {
  if (get(cellLock)) return; // Don't change if locked
  cellSize.set(newSize);
  boardCells.set(createEmptyBoard(newSize));
};

// History state
export const undoStack = writable<(string | null)[][][]>([]);
export const redoStack = writable<(string | null)[][][]>([]);

export const pushHistory = (cells: (string | null)[][]) => {
  const cloned = cells.map(row => [...row]);
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
  const prev = u.pop()!;
  undoStack.set(u);

  redoStack.update(r => [...r, get(boardCells).map(row => [...row])]);
  boardCells.set(prev);
};

export const redo = () => {
  const r = get(redoStack);
  if (r.length === 0) return;
  const next = r.pop()!;
  redoStack.set(r);

  undoStack.update(u => [...u, get(boardCells).map(row => [...row])]);
  boardCells.set(next);
};

export const clearBoard = () => {
  const size = get(cellSize);
  pushHistory(get(boardCells));
  boardCells.set(createEmptyBoard(size));
  cellLock.set(false);
};

// Seeds
const SEED_BOARDS: SavedBoard[] = [
  { id: '1', name: 'Pattern Alpha', tag: 'pattern', favorite: false, cells: createEmptyBoard(40), cellSize: 40 },
  { id: '2', name: 'Hero Portrait', tag: 'portrait', favorite: true, cells: createEmptyBoard(40), cellSize: 40 },
  { id: '3', name: 'Abstract Noise', tag: 'abstract', favorite: false, cells: createEmptyBoard(40), cellSize: 40 },
  { id: '4', name: 'App Logo', tag: 'logo', favorite: false, cells: createEmptyBoard(40), cellSize: 40 },
];

export const savedBoards = writable<SavedBoard[]>([...SEED_BOARDS]);
export const versions = writable<VersionSnapshot[]>([]);

export const visibleBoards = derived([savedBoards, tagFilter], ([$savedBoards, $tagFilter]) => {
  if (!$tagFilter) return $savedBoards;
  return $savedBoards.filter(b => b.tag === $tagFilter);
});

export const addBoard = (board: Omit<SavedBoard, 'id'>) => {
  savedBoards.update(boards => [...boards, { ...board, id: Date.now().toString() }]);
};
export const updateBoard = (id: string, updates: Partial<SavedBoard>) => {
  savedBoards.update(boards => boards.map(b => b.id === id ? { ...b, ...updates } : b));
};
export const deleteBoard = (id: string) => {
  savedBoards.update(boards => boards.filter(b => b.id !== id));
};
export const clearAllBoards = () => {
  savedBoards.set([]);
};

export const addVersion = (version: Omit<VersionSnapshot, 'id' | 'timestamp'>) => {
  versions.update(v => [...v, { ...version, id: Date.now().toString(), timestamp: Date.now() }]);
};
