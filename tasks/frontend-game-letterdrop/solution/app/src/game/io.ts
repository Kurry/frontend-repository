// Payload builders, the import validator, and a couple of small DOM helpers
// (clipboard copy, human-readable formatting) shared by the chrome.
//
// The validators here are the single source of truth for "is this JSON a
// conforming letterdrop-game-v1 / letterdrop-history-v1 record?" — both the
// visible Import control and the WebMCP import handler call them, so a wrong
// format literal, a schemaVersion other than 1, or a missing required field is
// rejected identically from either path and never mutates the History or the
// live run.

import type { GameResult, HistoryArchive, RunWord, GameState, Tile } from './types';
import { DIFFICULTY_TIERS } from './types';

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isNonNegInt = (v: unknown): v is number => isInt(v) && (v as number) >= 0;
const isPosInt = (v: unknown): v is number => isInt(v) && (v as number) >= 1;
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

function isValidRunWord(w: unknown): string | null {
  if (!w || typeof w !== 'object') return 'a words entry is not an object';
  const o = w as Record<string, unknown>;
  if (!isNonEmptyString(o.word)) return 'a words entry is missing the required string field "word"';
  if (!/^[A-Z]{2,15}$/.test(o.word)) return 'a words entry "word" must be 2-15 uppercase A-Z letters';
  if (!isPosInt(o.points)) return 'a words entry is missing the required positive-integer field "points"';
  return null;
}

export function validateGameResult(o: unknown): string | null {
  if (!o || typeof o !== 'object') return 'the payload is not an object';
  const r = o as Record<string, unknown>;
  if (r.format !== 'letterdrop-game-v1') return 'the field "format" must be exactly "letterdrop-game-v1"';
  if (r.schemaVersion !== 1) return 'the field "schemaVersion" must be exactly 1';
  if (!isNonNegInt(r.score)) return 'the required non-negative-integer field "score" is missing or invalid';
  if (!isNonNegInt(r.tilesCleared)) return 'the required non-negative-integer field "tilesCleared" is missing or invalid';
  if (!isNonNegInt(r.durationSec)) return 'the required non-negative-integer field "durationSec" is missing or invalid';
  if (!isNonEmptyString(r.playerName) || r.playerName.length < 2 || r.playerName.length > 20) {
    return 'the required field "playerName" must be a string of 2-20 characters';
  }
  if (!isPosInt(r.tierReached)) return 'the required positive-integer field "tierReached" is missing or invalid';
  if (!isNonEmptyString(r.endedAt) || Number.isNaN(Date.parse(r.endedAt))) {
    return 'the required field "endedAt" must be an ISO-8601 timestamp string';
  }
  if (r.result !== 'game_over') return 'the required field "result" must be exactly "game_over"';
  if (!Array.isArray(r.words)) return 'the required array field "words" is missing';
  for (const w of r.words) {
    const err = isValidRunWord(w);
    if (err) return err;
  }
  return null;
}

export interface ImportDecision {
  ok: boolean;
  mode?: 'run' | 'history';
  runs?: GameResult[];
  error?: string;
}

// Parse already-read text. Returns a structured decision; the caller decides
// how to surface `error` to the user (the same string reaches both the visible
// Import control and the WebMCP import handler).
export function parseImport(text: string): ImportDecision {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is invalid: the payload is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'File is invalid: the payload is not an object.' };
  }
  const format = (parsed as Record<string, unknown>).format;
  if (format === 'letterdrop-game-v1') {
    const err = validateGameResult(parsed);
    if (err) return { ok: false, error: `File is invalid: ${err}.` };
    return { ok: true, mode: 'run', runs: [parsed as GameResult] };
  }
  if (format === 'letterdrop-history-v1') {
    const h = parsed as Partial<HistoryArchive>;
    if (h.schemaVersion !== 1) return { ok: false, error: 'File is invalid: the field "schemaVersion" must be exactly 1.' };
    if (!Array.isArray(h.runs)) return { ok: false, error: 'File is invalid: the required array field "runs" is missing.' };
    const runs: GameResult[] = [];
    for (let i = 0; i < h.runs.length; i++) {
      const err = validateGameResult(h.runs[i]);
      if (err) return { ok: false, error: `File is invalid: runs[${i}] — ${err}.` };
      runs.push(h.runs[i] as GameResult);
    }
    return { ok: true, mode: 'history', runs };
  }
  return {
    ok: false,
    error: 'File is invalid: the field "format" must be "letterdrop-game-v1" or "letterdrop-history-v1".',
  };
}

export function buildGameResult(state: GameState, endedAt: string): GameResult {
  const tierReached = Math.max(1, state.maxTierReached, state.difficulty + 1);
  return {
    format: 'letterdrop-game-v1',
    schemaVersion: 1,
    score: Math.max(0, Math.round(state.score)),
    tilesCleared: Math.max(0, Math.round(state.tilesCleared)),
    durationSec: Math.max(0, Math.round(state.elapsedTime)),
    playerName: state.playerName,
    tierReached,
    endedAt,
    result: 'game_over',
    words: state.currentRunWords.map((w) => ({ word: w.word, points: w.points })),
  };
}

export function buildHistoryArchive(history: GameResult[]): HistoryArchive {
  return {
    format: 'letterdrop-history-v1',
    schemaVersion: 1,
    runs: history.map((r) => ({ ...r, words: r.words.map((w) => ({ ...w })) })),
  };
}

export function tierName(difficultyIndex: number): string {
  return (DIFFICULTY_TIERS[difficultyIndex] || DIFFICULTY_TIERS[0]).name;
}

// Human-readable clock mm:ss from a whole-seconds value.
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// Human-readable run duration as "Xm Ys".
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

// A friendly local date/time from an ISO endedAt string, falling back to the
// raw string if it does not parse.
export function formatEndedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Write text to the clipboard through the real UI path. The Clipboard API is
// guarded (it is absent in insecure contexts and can reject); a textarea +
// execCommand fallback is attempted before reporting failure, and every async
// rejection is handled so the UI never confirms a copy that did not happen.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try {
        await nav.clipboard.writeText(text);
        return true;
      } catch {
        return fallbackCopy(text);
      }
    }
    return fallbackCopy(text);
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text: string): boolean {
  let ta: HTMLTextAreaElement | null = null;
  try {
    ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    return ok;
  } catch {
    return false;
  } finally {
    ta?.remove();
  }
}

// Public read-only projection of live tiles for a test harness that needs to
// aim REAL pointer clicks at falling tiles. This performs no mutations and
// creates no success path of its own; it only exposes positions.
export function projectTilesForDebug(tiles: Tile[]) {
  return tiles.map((t) => ({
    id: t.id,
    letter: t.letter,
    x: Math.round(t.x),
    y: Math.round(t.y),
    column: t.column,
    type: t.type,
    selected: t.selected,
  }));
}
