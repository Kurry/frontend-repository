// Deterministic local live-event stream for the Dare Night play screen.
// Events carry a stable id and a logical timestamp (seq). Applying is
// idempotent by id, and the visible per-player bonus is derived by replaying
// applied events in seq order, so out-of-order delivery resolves
// deterministically and duplicate/reconnect delivery never double-applies.

export interface LiveEvent {
  id: string;
  seq: number;
  player: string;
  points: number;
}

export type StreamStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'disconnected'
  | 'caught-up';

export const STREAM_STATUS_LABEL: Record<StreamStatus, string> = {
  idle: 'Idle',
  active: 'Active',
  paused: 'Paused',
  disconnected: 'Disconnected',
  'caught-up': 'Caught up',
};

// Build a fixed, deterministic event source for the current roster. Points are
// fixed per seq so the final totals are identical regardless of delivery order.
export function buildEventSource(players: string[]): LiveEvent[] {
  const pointsBySeq = [1, 2, 1, 3, 2, 1];
  return pointsBySeq.map((points, i) => ({
    id: `evt-${i + 1}`,
    seq: i + 1,
    player: players[i % players.length],
    points,
  }));
}

// Derive per-player bonus totals by replaying applied events in seq order.
export function deriveBonuses(applied: LiveEvent[]): Record<string, number> {
  const ordered = [...applied].sort((a, b) => a.seq - b.seq);
  const totals: Record<string, number> = {};
  for (const ev of ordered) {
    totals[ev.player] = (totals[ev.player] ?? 0) + ev.points;
  }
  return totals;
}
