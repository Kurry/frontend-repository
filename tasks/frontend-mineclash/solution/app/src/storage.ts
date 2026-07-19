import type { AppStore, StatsData } from './types';

const KEY = 'mineclash_v1';

interface Saved {
  soundEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
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
    if (!raw) return;
    const d: Saved = JSON.parse(raw);
    if (d.soundEnabled !== undefined) store.soundEnabled = d.soundEnabled;
    if (d.difficulty) store.difficulty = d.difficulty;
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
  } catch { /* ignore */ }
}

export function saveToStorage(store: AppStore) {
  const s = ls();
  if (!s) return;
  try {
    const d: Saved = {
      soundEnabled: store.soundEnabled,
      difficulty: store.difficulty,
      stats: {
        easy: { ...store.stats.easy },
        medium: { ...store.stats.medium },
        hard: { ...store.stats.hard },
      },
    };
    s.setItem(KEY, JSON.stringify(d));
  } catch { /* ignore */ }
}
