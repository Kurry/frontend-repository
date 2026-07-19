import type { StreamEvent } from './types';

// Deterministic local event stream. Every event carries a stable ID and a
// logical timestamp (ts). Applying an event adds one note to the active
// board at a position derived from ts, so the final board state depends only
// on which events were applied — never on arrival order.
export const STREAM_EVENTS: StreamEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `evt-${String(i + 1).padStart(3, '0')}`,
  ts: i + 1,
  text: `Live update ${i + 1}`,
}));

export const streamNotePosition = (ts: number) => ({
  x: 32 + ((ts - 1) % 4) * 236,
  y: 96 + Math.floor((ts - 1) / 4) * 168,
});
