import { component$, useStore, useContextProvider, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { AppStore } from '../types';
import { defaultStats, doRivalTurn, initNewMatch, resetMatch } from '../gameLogic';
import { loadFromStorage, saveToStorage } from '../storage';
import { initWebMcp, type MineClashApi } from '../webmcp';
import type { Difficulty } from '../types';
import { SetupScreen } from './SetupScreen';
import { GameScreen } from './GameScreen';
import { RoundResultOverlay } from './RoundResultOverlay';
import { MatchCompleteScreen } from './MatchCompleteScreen';
import { StatsScreen } from './StatsScreen';

function makeStore(): AppStore {
  return {
    phase: 'setup',
    difficulty: 'easy',
    soundEnabled: true,
    playerMode: 'reveal',
    isRivalThinking: false,
    paused: false,
    hintsUsed: 0,
    tiles: [],
    rows: 8,
    cols: 8,
    mineCount: 10,
    targetScore: 50,
    player: { score: 0, strikes: 0 },
    rival: { score: 0, strikes: 0 },
    roundPlayerOreMined: 0,
    currentTurn: 'player',
    roundNumber: 1,
    matchRounds: [],
    playerMatchWins: 0,
    rivalMatchWins: 0,
    lastRoundResult: null,
    historyNodes: [],
    currentHistoryId: null,
    selectedHistoryId: null,
    stats: defaultStats(),
    showHistoryPanel: false,
    lastPlayerActionLabel: '',
    feedback: '',
  };
}

export const App = component$(() => {
  const store = useStore<AppStore>(makeStore, { deep: true });
  const storageReady = useSignal(false);
  useContextProvider(AppCtx, store);

  useVisibleTask$(() => {
    loadFromStorage(store);
    storageReady.value = true;
  });

  // Publish the WebMCP API bound to the real store + the same action functions
  // the visible controls call, then expose the window.webmcp_* surface.
  useVisibleTask$(() => {
    const w = window as unknown as Record<string, unknown>;
    const mcApi: MineClashApi = {
      store,
      startMatch: () => initNewMatch(store),
      restartMatch: () => resetMatch(store),
      newMatch: () => {
        store.paused = false;
        store.phase = 'setup';
      },
      setPaused: (v: boolean) => {
        if (store.phase === 'playing') store.paused = v;
      },
      setDifficulty: (d: Difficulty) => {
        if (store.phase === 'setup') store.difficulty = d;
      },
      goto: (dest: 'game-board' | 'stats') => {
        if (dest === 'stats') {
          store.phase = 'stats';
        } else if (store.phase !== 'playing' && store.phase !== 'round-result') {
          store.phase = 'setup';
        }
      },
    };
    w.__mineclashApi = mcApi;
    initWebMcp();
  });

  useVisibleTask$(({ track }) => {
    const ready = track(() => storageReady.value);
    track(() => store.soundEnabled);
    track(() => store.difficulty);
    track(() => store.stats.easy.matchesPlayed);
    track(() => store.stats.medium.matchesPlayed);
    track(() => store.stats.hard.matchesPlayed);
    track(() => store.stats.easy.matchesWon);
    track(() => store.stats.medium.matchesWon);
    track(() => store.stats.hard.matchesWon);
    track(() => store.stats.easy.totalOreMined);
    track(() => store.stats.medium.totalOreMined);
    track(() => store.stats.hard.totalOreMined);
    track(() => store.stats.easy.bestSingleRoundScore);
    track(() => store.stats.medium.bestSingleRoundScore);
    track(() => store.stats.hard.bestSingleRoundScore);
    if (!ready) return;
    saveToStorage(store);
  }, { strategy: 'document-ready' });

  useVisibleTask$(({ track }) => {
    const thinking = track(() => store.isRivalThinking);
    const phase = track(() => store.phase);
    const paused = track(() => store.paused);
    if (!thinking || phase !== 'playing' || paused) return;
    const delay = 900 + Math.random() * 700;
    const tid = setTimeout(() => {
      doRivalTurn(store);
    }, delay);
    return () => clearTimeout(tid);
  }, { strategy: 'document-ready' });

  return (
    <main style={{ minHeight: '100vh', background: '#1C1917', color: '#FAFAF9', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {store.phase === 'setup' && <SetupScreen />}
      {(store.phase === 'playing' || store.phase === 'round-result') && <GameScreen />}
      {store.phase === 'round-result' && <RoundResultOverlay />}
      {store.phase === 'match-complete' && <MatchCompleteScreen />}
      {store.phase === 'stats' && <StatsScreen />}
    </main>
  );
});
