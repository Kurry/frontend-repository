import type { AppStore, StatsData } from './types';

const KEY = 'mineclash_v1';
const LOG_KEY = 'mineclash_v1_log';
const CHECKPOINT_KEY = 'mineclash_v1_checkpoint';

interface Saved {
  soundEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  playerName: string;
  stats: StatsData;
}

function ls(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function loadFromStorage(store: AppStore) {
  const s = ls();
  if (!s) return;
  try {
    const raw = s.getItem(KEY);
    if (raw) {
      const d: Saved = JSON.parse(raw);
      if (d.soundEnabled !== undefined) store.soundEnabled = d.soundEnabled;
      if (d.difficulty) store.difficulty = d.difficulty;
      if (d.playerName) store.playerName = d.playerName;
      if (d.stats) {
        for (const k of ['easy', 'medium', 'hard'] as const) {
          if (d.stats[k]) {
            store.stats[k].matchesPlayed = d.stats[k].matchesPlayed || 0;
            store.stats[k].matchesWon = d.stats[k].matchesWon || 0;
            store.stats[k].totalOreMined = d.stats[k].totalOreMined || 0;
            store.stats[k].bestSingleRoundScore = d.stats[k].bestSingleRoundScore || 0;
          }
        }
      }
    }

    const logRaw = s.getItem(LOG_KEY);
    if (logRaw) {
      store.matchLog = JSON.parse(logRaw);
    } else {
      store.matchLog = [];
    }

    const checkpointRaw = s.getItem(CHECKPOINT_KEY);
    if (checkpointRaw) {
      const cp = JSON.parse(checkpointRaw);
      store.roundNumber = cp.roundNumber;
      store.playerMatchWins = cp.playerRoundWins;
      store.rivalMatchWins = cp.rivalRoundWins;
      store.player.score = cp.playerScore;
      store.player.strikes = cp.playerStrikes;
      store.rival.score = cp.rivalScore;
      store.rival.strikes = cp.rivalStrikes;
      store.currentTurn = cp.sideToMove;
      store.hintsUsed = 2 - cp.hintsRemaining;
      store.tiles = cp.tiles;
      store.rows = cp.tiles.length;
      store.cols = cp.tiles[0]?.length || 0;
      store.matchRounds = cp.matchRounds || [];
    }

  } catch { /* ignore */ }
}

export function saveToStorage(store: AppStore) {
  const s = ls();
  if (!s) return;
  try {
    const d: Saved = {
      soundEnabled: store.soundEnabled,
      difficulty: store.difficulty,
      playerName: store.playerName,
      stats: {
        easy: { ...store.stats.easy },
        medium: { ...store.stats.medium },
        hard: { ...store.stats.hard },
      },
    };
    s.setItem(KEY, JSON.stringify(d));
    s.setItem(LOG_KEY, JSON.stringify(store.matchLog));

    let hasReveals = false;
    if (store.tiles) {
      for (const row of store.tiles) {
        for (const t of row) {
          if (t.revealed) { hasReveals = true; break; }
        }
        if (hasReveals) break;
      }
    }

    if ((store.phase === 'playing' || store.phase === 'round-result') && hasReveals) {
      s.setItem(CHECKPOINT_KEY, JSON.stringify({
        playerName: store.playerName,
        difficulty: store.difficulty,
        roundNumber: store.roundNumber,
        playerScore: store.player.score,
        rivalScore: store.rival.score,
        playerStrikes: store.player.strikes,
        rivalStrikes: store.rival.strikes,
        sideToMove: store.currentTurn,
        hintsRemaining: 2 - store.hintsUsed,
        playerRoundWins: store.playerMatchWins,
        rivalRoundWins: store.rivalMatchWins,
        tiles: store.tiles,
        matchRounds: store.matchRounds,
      }));
    } else if (store.phase === 'setup' || store.phase === 'match-complete') {
        s.removeItem(CHECKPOINT_KEY);
    }

  } catch { /* ignore */ }
}
