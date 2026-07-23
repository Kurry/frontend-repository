<script lang="ts">
  import confetti from 'canvas-confetti';
  import { BUILT_IN_CARDS, weightedShuffle, type Card, type Category, type Intensity } from '../lib/cards';
  import { buildEventSource, deriveBonuses, type LiveEvent, type StreamStatus } from '../lib/stream';
  import { registerWebmcp, type ToolResult, type WebmcpActions } from '../lib/webmcp';
  import { motionMs, prefersReducedMotion } from '../lib/motion';
  import SetupScreen from './SetupScreen.svelte';
  import GameScreen from './GameScreen.svelte';
  import Toast from './Toast.svelte';
  import Dialog from './Dialog.svelte';
  import ExportPreviewDialog from './ExportPreviewDialog.svelte';
  import ImportSessionDialog from './ImportSessionDialog.svelte';

  // ---- storage helpers that never throw, even when localStorage is blocked ----
  function safeGet<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }
  function safeSet<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable — degrade silently, keep playing */ }
  }
  function safeRemove(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    } catch { /* ignore */ }
  }

  const KEY_GAME = 'dare-night-game';
  const KEY_CARDS = 'dare-night-custom-cards';
  const KEY_RECORD = 'dare-night-best-record';
  const KEY_CHECKPOINT = 'dare-night-checkpoint';
  const WIN_TARGET = 10;

  // ============ STATE ============
  let phase = $state<'setup' | 'playing' | 'finished'>('setup');
  let players = $state<string[]>([]);
  let currentPlayerIndex = $state(0);
  let scores = $state<Record<string, { points: number; forfeits: number }>>({});
  let selectedCategories = $state<Category[]>(['Icebreaker', 'Truth', 'Dare', 'Wild']);
  let selectedIntensity = $state<Intensity>('Mild');
  let customCards = $state<Card[]>([]);
  let bestRecord = $state<{ name: string; points: number } | null>(null);
  let deck = $state<Card[]>([]);
  let drawnCards = $state<Card[]>([]);
  let currentCard = $state<Card | null>(null);
  let lastDrawnCardId = $state<string | null>(null);
  let reshuffleMessage = $state(false);
  let timerEnabled = $state(false);
  let timeLeft = $state(15);
  let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);
  let turnLog = $state<{ playerName: string; outcome: 'done' | 'skip' | 'timeout'; cardPrompt: string; category: string; intensity: string }[]>([]);
  let canUndo = $state(false);
  let undoData = $state<{
    playerIndex: number;
    scores: Record<string, { points: number; forfeits: number }>;
    card: Card | null;
    lastDrawnCardId: string | null;
    timeLeft: number;
    turnLog: typeof turnLog;
  } | null>(null);
  let toasts = $state<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  let toastCounter = $state(0);

  // dialog visibility
  let showNewGameConfirm = $state(false);
  let showDeleteConfirm = $state<string | null>(null);
  let showExportPreview = $state(false);
  let showImportDialog = $state(false);

  let isInitialized = $state(false);
  let hasCheckpoint = $state(false);

  // ---- setup roster (lifted so WebMCP + UI share code paths) ----
  let setupPlayerNames = $state<string[]>(['', '']);
  let newPlayerInput = $state('');
  let playerError = $state('');
  let categoryError = $state('');
  let startAttempted = $state(false);

  // ---- live-event stream ----
  let streamStatus = $state<StreamStatus>('idle');
  let eventSource = $state<LiveEvent[]>([]);
  let appliedEvents = $state<LiveEvent[]>([]);
  let duplicatesIgnored = $state(0);
  let streamInterval = $state<ReturnType<typeof setInterval> | null>(null);
  let reconnectTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  // ============ DERIVED ============
  let currentPlayer = $derived(players[currentPlayerIndex] ?? '');
  let winner = $derived(players.find(p => (scores[p]?.points ?? 0) >= WIN_TARGET) ?? null);
  let sortedScores = $derived(
    players
      .map(name => ({ name, points: scores[name]?.points ?? 0, forfeits: scores[name]?.forfeits ?? 0 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  );
  let allCards = $derived([...BUILT_IN_CARDS, ...customCards]);
  let validSetupPlayers = $derived(setupPlayerNames.map(n => n.trim()).filter(Boolean));
  let setupHasDupes = $derived((() => {
    const lower = validSetupPlayers.map(n => n.toLowerCase());
    return lower.some((n, i) => lower.indexOf(n) !== i);
  })());
  let canStart = $derived(
    validSetupPlayers.length >= 2 && validSetupPlayers.length <= 8 &&
    selectedCategories.length > 0 && !setupHasDupes &&
    validSetupPlayers.every(n => n.length <= 20)
  );
  let bonuses = $derived((() => {
    const totals = deriveBonuses(appliedEvents);
    return players.map(name => ({ name, bonus: totals[name] ?? 0 }));
  })());
  let offeredEvent = $derived((() => {
    const applied = new Set(appliedEvents.map(e => e.id));
    const undelivered = eventSource.filter(e => !applied.has(e.id));
    if (undelivered.length === 0) return null;
    return undelivered.reduce((hi, e) => (e.seq > hi.seq ? e : hi), undelivered[0]);
  })());

  // ============ TOAST ============
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = ++toastCounter;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 3000);
  }

  // ============ DECK (single copy, weighted order) ============
  function buildDeck(): Card[] {
    const filtered = allCards.filter(card => selectedCategories.includes(card.category));
    return weightedShuffle(filtered, selectedIntensity);
  }

  // ============ SETUP ROSTER ============
  function addSetupPlayer(rawName: string): ToolResult {
    const name = (rawName ?? '').trim();
    if (!name) {
      playerError = 'Field name is required — enter 1 to 20 characters';
      return { ok: false, message: playerError };
    }
    if (name.length > 20) {
      playerError = 'Field name must be 1 to 20 characters';
      return { ok: false, message: playerError };
    }
    const filled = setupPlayerNames.map(n => n.trim()).filter(Boolean);
    if (filled.length >= 8) {
      playerError = 'Roster is full — Dare Night supports up to 8 players';
      return { ok: false, message: playerError };
    }
    const lower = [...filled, name].map(n => n.toLowerCase());
    if (lower.some((n, i) => lower.indexOf(n) !== i)) {
      playerError = `Field name must be unique — "${name}" is already in the roster`;
      return { ok: false, message: playerError };
    }
    // fill the first empty slot, else append
    const emptyIdx = setupPlayerNames.findIndex(n => n.trim() === '');
    if (emptyIdx >= 0) {
      setupPlayerNames = setupPlayerNames.map((n, i) => (i === emptyIdx ? name : n));
    } else {
      setupPlayerNames = [...setupPlayerNames, name];
    }
    newPlayerInput = '';
    playerError = '';
    return { ok: true, message: `Added ${name}`, roster: [...validSetupPlayers] };
  }

  function removeSetupPlayer(index: number) {
    setupPlayerNames = setupPlayerNames.filter((_, i) => i !== index);
    if (setupPlayerNames.length < 2) setupPlayerNames = [...setupPlayerNames, ''];
    playerError = '';
  }

  function updateSetupPlayerName(index: number, value: string) {
    setupPlayerNames = setupPlayerNames.map((n, i) => (i === index ? value : n));
    const nonEmpty = setupPlayerNames.map(n => n.trim()).filter(Boolean);
    if (nonEmpty.some(n => n.length > 20)) {
      playerError = 'Field name must be 1 to 20 characters';
    } else {
      const lower = nonEmpty.map(n => n.toLowerCase());
      if (lower.some((n, i) => lower.indexOf(n) !== i)) {
        const dup = nonEmpty.find((n, i) => lower.indexOf(n.toLowerCase()) !== i);
        playerError = `Field name must be unique — "${dup ?? ''}" is duplicated`;
      } else {
        playerError = '';
      }
    }
  }

  function toggleCategory(cat: Category) {
    selectedCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    categoryError = '';
  }
  function setCategories(cats: Category[]) { selectedCategories = cats; categoryError = ''; }

  function validateSetup(): ToolResult {
    startAttempted = true;
    if (validSetupPlayers.length < 2) {
      playerError = 'Add at least 2 players (field name is required for each)';
      return { ok: false, message: playerError };
    }
    if (validSetupPlayers.some(n => n.length > 20)) {
      playerError = 'Field name must be 1 to 20 characters';
      return { ok: false, message: playerError };
    }
    if (setupHasDupes) {
      playerError = 'Field name must be unique across the roster';
      return { ok: false, message: playerError };
    }
    if (selectedCategories.length === 0) {
      categoryError = 'Select at least one category to build a deck';
      return { ok: false, message: categoryError };
    }
    playerError = '';
    categoryError = '';
    return { ok: true, message: 'Setup is valid' };
  }

  function submitSetup(): ToolResult {
    const v = validateSetup();
    if (!v.ok) return v;
    startGame(validSetupPlayers);
    return { ok: true, message: `Started game with ${players.length} players`, players: [...players] };
  }

  // ============ GAME ============
  function startGame(playerNames: string[]) {
    players = [...playerNames];
    currentPlayerIndex = 0;
    const newScores: Record<string, { points: number; forfeits: number }> = {};
    for (const name of playerNames) newScores[name] = { points: 0, forfeits: 0 };
    scores = newScores;
    deck = buildDeck();
    drawnCards = [];
    turnLog = [];
    currentCard = null;
    lastDrawnCardId = null;
    canUndo = false;
    undoData = null;
    phase = 'playing';
    reshuffleMessage = false;
    initStream();
  }

  function drawCard(): Card | undefined {
    if (phase !== 'playing' || winner) return undefined;
    if (deck.length === 0) {
      deck = buildDeck();
      drawnCards = [];
      reshuffleMessage = true;
      showToast('Deck reshuffled — drawing from a fresh shuffle', 'info');
      setTimeout(() => { reshuffleMessage = false; }, 2600);
    }
    let card: Card | undefined;
    if (lastDrawnCardId && deck.length > 1) {
      const idx = deck.findIndex(c => c.id !== lastDrawnCardId);
      card = idx >= 0 ? deck.splice(idx, 1)[0] : deck.pop();
    } else {
      card = deck.pop();
    }
    if (card) {
      currentCard = card;
      lastDrawnCardId = card.id;
      drawnCards = [...drawnCards, card];
      canUndo = false;
      startTimer();
    }
    return card;
  }

  function startTimer(initialSeconds = 15) {
    stopTimer();
    if (!timerEnabled || phase !== 'playing') return;
    timeLeft = Math.max(1, Math.min(15, Math.floor(initialSeconds)));
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) { stopTimer(); handleTimerForfeit(); }
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function saveUndoState() {
    undoData = {
      playerIndex: currentPlayerIndex,
      scores: JSON.parse(JSON.stringify(scores)),
      card: currentCard,
      lastDrawnCardId,
      timeLeft,
      turnLog: [...turnLog],
    };
  }

  function logTurn(outcome: 'done' | 'skip' | 'timeout') {
    if (currentCard) {
      turnLog = [...turnLog, {
        playerName: players[currentPlayerIndex],
        outcome,
        cardPrompt: currentCard.prompt,
        category: currentCard.category,
        intensity: currentCard.intensity,
      }];
    }
  }

  function handleTimerForfeit() {
    if (phase !== 'playing' || winner) return;
    const playerName = players[currentPlayerIndex];
    if (!playerName || !scores[playerName]) return;
    saveUndoState();
    scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
    logTurn('timeout');
    canUndo = true;
    showToast(`${playerName}: time's up — forfeit recorded`, 'error');
    advanceTurn();
  }

  function handleDone() {
    if (phase !== 'playing' || winner || !currentCard) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (!playerName || !scores[playerName]) return;
    saveUndoState();
    scores = { ...scores, [playerName]: { ...scores[playerName], points: scores[playerName].points + 1 } };
    logTurn('done');
    canUndo = true;
    showToast(`${playerName} scored +1`, 'success');
    const setNewRecord = updateBestRecord();
    if (scores[playerName].points >= WIN_TARGET) {
      phase = 'finished';
      currentCard = null;
      canUndo = false;
      stopStream();
      if (!prefersReducedMotion()) { try { (typeof confetti === 'function' ? confetti : (confetti as any)?.default)({ particleCount: 140, spread: 90, origin: { y: 0.55 } }); } catch (e) {} }
      return;
    }
    if (setNewRecord && !prefersReducedMotion()) {
      try { (typeof confetti === 'function' ? confetti : (confetti as any)?.default)({ particleCount: 90, spread: 65, origin: { y: 0.6 } }); } catch (e) {} 
    }
    advanceTurn();
  }

  function handleSkip() {
    if (phase !== 'playing' || winner || !currentCard) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (!playerName || !scores[playerName]) return;
    saveUndoState();
    scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
    logTurn('skip');
    canUndo = true;
    showToast(`${playerName} skipped — forfeit recorded`, 'info');
    advanceTurn();
  }

  function advanceTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    currentCard = null;
  }

  function undoLastTurn() {
    if (!canUndo || !undoData) return;
    const snapshot = undoData;
    currentPlayerIndex = snapshot.playerIndex;
    scores = JSON.parse(JSON.stringify(snapshot.scores));
    currentCard = snapshot.card;
    lastDrawnCardId = snapshot.lastDrawnCardId;
    turnLog = [...snapshot.turnLog];
    if (drawnCards.length > 0) drawnCards = drawnCards.slice(0, -1);
    canUndo = false;
    undoData = null;
    stopTimer();
    // A timer forfeit snapshots at 0 seconds. Restarting from that value used
    // to forfeit the restored card again one second after Undo, making Undo
    // appear reusable and hiding the exact card the player asked to restore.
    if (currentCard && timerEnabled) startTimer(snapshot.timeLeft > 0 ? snapshot.timeLeft : 15);
    showToast('Last turn undone', 'info');
  }

  function updateBestRecord(): boolean {
    let updated = false;
    for (const playerName of players) {
      const pts = scores[playerName]?.points ?? 0;
      if (pts > 0 && (!bestRecord || pts > bestRecord.points)) {
        bestRecord = { name: playerName, points: pts };
        safeSet(KEY_RECORD, bestRecord);
        updated = true;
      }
    }
    return updated;
  }

  function newGame() {
    showNewGameConfirm = false;
    phase = 'setup';
    players = [];
    currentPlayerIndex = 0;
    scores = {};
    deck = [];
    drawnCards = [];
    currentCard = null;
    lastDrawnCardId = null;
    turnLog = [];
    canUndo = false;
    undoData = null;
    reshuffleMessage = false;
    setupPlayerNames = ['', ''];
    newPlayerInput = '';
    playerError = '';
    categoryError = '';
    startAttempted = false;
    stopTimer();
    stopStream();
    clearReconnect();
    eventSource = [];
    appliedEvents = [];
    duplicatesIgnored = 0;
    streamStatus = 'idle';
    // Per spec: a new game clears players/scores but preserves the Dare Night
    // record, the custom cards, and any saved checkpoint (so Resume stays offered).
    safeRemove(KEY_GAME);
  }

  // ============ CUSTOM CARDS ============
  function addCustomCard(prompt: string, category: Category, intensity: Intensity): ToolResult {
    const text = (prompt ?? '').trim();
    if (text.length < 8 || text.length > 200) {
      return { ok: false, message: 'Field prompt must be 8 to 200 characters' };
    }
    if (!(['Icebreaker', 'Truth', 'Dare', 'Wild'] as Category[]).includes(category)) {
      return { ok: false, message: 'Field category must be one of Icebreaker, Truth, Dare, Wild' };
    }
    if (!(['Mild', 'Spicy', 'Wild'] as Intensity[]).includes(intensity)) {
      return { ok: false, message: 'Field intensity must be one of Mild, Spicy, Wild' };
    }
    const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    customCards = [...customCards, { id, prompt: text, category, intensity, isCustom: true }];
    saveCustomCards();
    showToast('Custom card added to the deck', 'success');
    return { ok: true, message: 'Custom card added', id };
  }
  function deleteCustomCard(id: string) {
    customCards = customCards.filter(c => c.id !== id);
    saveCustomCards();
    showToast('Custom card deleted', 'info');
    showDeleteConfirm = null;
  }
  function saveCustomCards() { safeSet(KEY_CARDS, customCards); }

  // ============ LIVE STREAM ============
  function initStream() {
    stopStream();
    clearReconnect();
    eventSource = buildEventSource(players);
    appliedEvents = [];
    duplicatesIgnored = 0;
    streamStatus = 'idle';
  }
  function applyEvent(ev: LiveEvent): boolean {
    if (appliedEvents.some(a => a.id === ev.id)) { duplicatesIgnored += 1; return false; }
    appliedEvents = [...appliedEvents, ev];
    return true;
  }
  function nextInOrderEvent(): LiveEvent | null {
    const applied = new Set(appliedEvents.map(e => e.id));
    const undelivered = eventSource.filter(e => !applied.has(e.id));
    if (undelivered.length === 0) return null;
    return undelivered.reduce((lo, e) => (e.seq < lo.seq ? e : lo), undelivered[0]);
  }
  function allDelivered(): boolean { return eventSource.length > 0 && appliedEvents.length >= eventSource.length; }
  function stopStream() { if (streamInterval) { clearInterval(streamInterval); streamInterval = null; } }
  function clearReconnect() { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; } }

  function streamStart(): ToolResult {
    if (eventSource.length === 0) return { ok: false, message: 'Start a game first to open the live stream' };
    if (allDelivered()) { streamStatus = 'caught-up'; return { ok: true, message: 'All events already delivered', status: streamStatus }; }
    stopStream();
    streamStatus = 'active';
    streamInterval = setInterval(() => {
      const ev = nextInOrderEvent();
      if (!ev) { stopStream(); streamStatus = 'caught-up'; return; }
      applyEvent(ev);
      if (allDelivered()) { stopStream(); streamStatus = 'caught-up'; }
    }, 700);
    return { ok: true, message: 'Live stream started', status: streamStatus };
  }
  function streamPause(): ToolResult { stopStream(); streamStatus = 'paused'; return { ok: true, message: 'Live stream paused', status: streamStatus }; }
  function streamResume(): ToolResult { return streamStart(); }
  function streamStop(): ToolResult { stopStream(); appliedEvents = []; duplicatesIgnored = 0; streamStatus = 'idle'; return { ok: true, message: 'Live stream stopped and reset', status: streamStatus }; }
  function streamRestart(): ToolResult { stopStream(); appliedEvents = []; duplicatesIgnored = 0; return streamStart(); }
  function streamAdvance(): ToolResult {
    const ev = nextInOrderEvent();
    if (!ev) { if (allDelivered()) streamStatus = 'caught-up'; return { ok: false, message: 'No further events to deliver' }; }
    applyEvent(ev);
    if (allDelivered()) streamStatus = 'caught-up';
    return { ok: true, message: `Delivered ${ev.id}`, applied: appliedEvents.length };
  }
  function streamDeliverOutOfOrder(): ToolResult {
    const ev = offeredEvent;
    if (!ev) return { ok: false, message: 'No offered event to deliver' };
    const ok = applyEvent(ev);
    if (allDelivered()) streamStatus = 'caught-up';
    return { ok, message: ok ? `Delivered ${ev.id} out of order` : `${ev.id} already applied (ignored)`, applied: appliedEvents.length };
  }
  function streamReconnect(): ToolResult {
    // Show a visible DISCONNECTED state, then catch up missed events exactly once.
    stopStream();
    clearReconnect();
    streamStatus = 'disconnected';
    reconnectTimer = setTimeout(() => {
      const applied = new Set(appliedEvents.map(e => e.id));
      const missed = eventSource.filter(e => !applied.has(e.id)).sort((a, b) => a.seq - b.seq);
      for (const ev of missed) applyEvent(ev);
      streamStatus = allDelivered() ? 'caught-up' : 'active';
      reconnectTimer = null;
    }, motionMs(900));
    return { ok: true, message: 'Reconnecting — catching up missed events', status: streamStatus };
  }
  function streamDisconnect(): ToolResult { stopStream(); clearReconnect(); streamStatus = 'disconnected'; return { ok: true, message: 'Live stream disconnected', status: streamStatus }; }

  // ============ EXPORT / IMPORT ============
  interface SessionPayload {
    schemaVersion: 'dare-night-session-v1';
    status: 'setup' | 'playing' | 'finished';
    players: { name: string; points: number; forfeits: number }[];
    categories: Category[];
    intensity: Intensity;
    roundTimer: boolean;
    currentTurnIndex: number;
    winTarget: number;
    winner: string | null;
    customCards: { prompt: string; category: Category; intensity: Intensity }[];
    record: { holder: string; points: number } | null;
    turnLog: typeof turnLog;
    exportedAt: string;
  }

  const CATEGORIES: Category[] = ['Icebreaker', 'Truth', 'Dare', 'Wild'];
  const INTENSITIES: Intensity[] = ['Mild', 'Spicy', 'Wild'];
  const OUTCOMES = ['done', 'skip', 'timeout'] as const;

  function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function isNonNegativeInteger(value: unknown): value is number {
    return Number.isInteger(value) && Number(value) >= 0;
  }

  function rebuildImportedDeck(log: SessionPayload['turnLog']): Card[] {
    const freshPool = () => allCards.filter(card => selectedCategories.includes(card.category));
    let remaining = freshPool();

    for (const entry of log) {
      let index = remaining.findIndex(card =>
        card.prompt === entry.cardPrompt &&
        card.category === entry.category &&
        card.intensity === entry.intensity
      );
      if (index < 0) {
        remaining = freshPool();
        index = remaining.findIndex(card =>
          card.prompt === entry.cardPrompt &&
          card.category === entry.category &&
          card.intensity === entry.intensity
        );
      }
      if (index >= 0) remaining.splice(index, 1);
    }

    return weightedShuffle(remaining.length > 0 ? remaining : freshPool(), selectedIntensity);
  }

  function exportSession(): SessionPayload {
    const sessionPlayers = phase === 'setup' ? validSetupPlayers : players;
    return {
      schemaVersion: 'dare-night-session-v1',
      status: winner ? 'finished' : phase,
      players: sessionPlayers.map(name => ({
        name,
        points: scores[name]?.points ?? 0,
        forfeits: scores[name]?.forfeits ?? 0,
      })),
      categories: selectedCategories,
      intensity: selectedIntensity,
      roundTimer: timerEnabled,
      currentTurnIndex: currentPlayerIndex,
      winTarget: WIN_TARGET,
      winner,
      customCards: customCards.map(({ prompt, category, intensity }) => ({ prompt, category, intensity })),
      record: bestRecord ? { holder: bestRecord.name, points: bestRecord.points } : null,
      turnLog: [...turnLog],
      exportedAt: new Date().toISOString(),
    };
  }

  function handleExportSession() { showExportPreview = true; }

  function downloadSessionJson() {
    const payload = exportSession();
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dare-night-session-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 1000);
      showToast('Session JSON downloaded', 'success');
    } catch { showToast('Download failed', 'error'); }
  }

  function handleCopySession() {
    const payload = exportSession();
    const text = JSON.stringify(payload, null, 2);
    const done = () => showToast('Copied session JSON to clipboard', 'info');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text: string, done: () => void) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch { showToast('Failed to copy session JSON', 'error'); }
  }

  function applyImportedPayload(payload: any): string | null {
    if (!isRecord(payload)) return 'the file is not a JSON object';
    if (payload.schemaVersion !== 'dare-night-session-v1') return `schemaVersion must be dare-night-session-v1 (got ${payload.schemaVersion})`;
    if (!['setup', 'playing', 'finished'].includes(payload.status)) return 'status is invalid';
    if (!Array.isArray(payload.players) || payload.players.length > 8) return 'players must contain no more than 8 entries';
    if (payload.status !== 'setup' && payload.players.length < 2) return 'playing and finished sessions require 2 to 8 players';
    const importedNames: string[] = [];
    for (const player of payload.players) {
      if (!isRecord(player)) return 'each player must be an object';
      if (typeof player.name !== 'string' || player.name !== player.name.trim() || player.name.length < 1 || player.name.length > 20) return 'each player field name must be a trimmed string of 1 to 20 characters';
      if (!isNonNegativeInteger(player.points)) return `player ${player.name} points must be a non-negative integer`;
      if (!isNonNegativeInteger(player.forfeits)) return `player ${player.name} forfeits must be a non-negative integer`;
      importedNames.push(player.name);
    }
    const lowerNames = importedNames.map(name => name.toLowerCase());
    if (lowerNames.some((name, index) => lowerNames.indexOf(name) !== index)) return 'player field name must be unique ignoring case';
    if (!Array.isArray(payload.categories) || !payload.categories.every((category: unknown) => CATEGORIES.includes(category as Category))) return 'categories must contain only Icebreaker, Truth, Dare, or Wild';
    if (new Set(payload.categories).size !== payload.categories.length) return 'categories must not contain duplicates';
    if (payload.status !== 'setup' && payload.categories.length === 0) return 'playing and finished sessions require at least one category';
    if (!INTENSITIES.includes(payload.intensity as Intensity)) return 'intensity is invalid';
    if (typeof payload.roundTimer !== 'boolean') return 'roundTimer must be a boolean';
    if (!Number.isInteger(payload.currentTurnIndex) || payload.currentTurnIndex < 0 || (payload.players.length === 0 ? payload.currentTurnIndex !== 0 : payload.currentTurnIndex >= payload.players.length)) return 'currentTurnIndex is out of range';
    if (payload.winTarget !== WIN_TARGET) return `winTarget must be ${WIN_TARGET}`;
    if (!('winner' in payload)) return 'winner field is missing';
    if (!Array.isArray(payload.customCards)) return 'customCards is missing';
    for (const card of payload.customCards) {
      if (!isRecord(card)) return 'each custom card must be an object';
      if (typeof card.prompt !== 'string' || card.prompt !== card.prompt.trim() || card.prompt.length < 8 || card.prompt.length > 200) return 'each custom card field prompt must be a trimmed string of 8 to 200 characters';
      if (!CATEGORIES.includes(card.category as Category)) return 'each custom card category is invalid';
      if (!INTENSITIES.includes(card.intensity as Intensity)) return 'each custom card intensity is invalid';
    }
    if (!('record' in payload) || (payload.record !== null && !isRecord(payload.record))) return 'record must be an object or null';
    if (isRecord(payload.record) && (typeof payload.record.holder !== 'string' || !isNonNegativeInteger(payload.record.points))) return 'record must contain a holder string and non-negative integer points';
    if (!Array.isArray(payload.turnLog)) return 'turnLog is missing';
    for (const entry of payload.turnLog) {
      if (!isRecord(entry)) return 'each turnLog entry must be an object';
      if (typeof entry.playerName !== 'string' || !importedNames.includes(entry.playerName)) return 'each turnLog playerName must name an imported player';
      if (!OUTCOMES.includes(entry.outcome as typeof OUTCOMES[number])) return 'each turnLog outcome must be done, skip, or timeout';
      if (typeof entry.cardPrompt !== 'string' || !CATEGORIES.includes(entry.category as Category) || !INTENSITIES.includes(entry.intensity as Intensity)) return 'each turnLog entry must include a cardPrompt, category, and intensity';
    }
    if (typeof payload.exportedAt !== 'string' || Number.isNaN(Date.parse(payload.exportedAt))) return 'exportedAt must be an ISO-8601 timestamp';
    const winningPlayer = payload.players.find((p: any) => p.points >= WIN_TARGET);
    if (payload.status === 'finished' && (!winningPlayer || payload.winner !== winningPlayer.name)) return 'a finished session must name a winner at the win target';
    if (payload.status !== 'finished' && (winningPlayer || payload.winner !== null)) return 'an unfinished session cannot include a winner';

    stopTimer();
    stopStream();
    clearReconnect();
    players = [...importedNames];
    scores = payload.players.reduce((acc: any, p: any) => {
      acc[p.name] = { points: p.points, forfeits: p.forfeits };
      return acc;
    }, {});
    currentPlayerIndex = payload.currentTurnIndex;
    selectedCategories = payload.categories;
    selectedIntensity = payload.intensity;
    timerEnabled = payload.roundTimer;
    turnLog = payload.turnLog;
    customCards = payload.customCards.map((c: any, i: number) => ({
      id: `custom-${Date.now()}-${i}`,
      prompt: String(c.prompt),
      category: c.category,
      intensity: c.intensity,
      isCustom: true,
    }));
    saveCustomCards();
    if (payload.record && typeof payload.record === 'object') {
      const importedRecord = { name: String(payload.record.holder), points: Number(payload.record.points) || 0 };
      if (!bestRecord || importedRecord.points > bestRecord.points) {
        bestRecord = importedRecord;
        safeSet(KEY_RECORD, bestRecord);
      }
    }
    phase = payload.status === 'setup' ? 'setup' : payload.status;
    if (phase === 'setup') {
      setupPlayerNames = players.length >= 2 ? [...players] : [...players, ...Array.from({ length: 2 - players.length }, () => '')];
      deck = [];
      drawnCards = [];
      currentCard = null;
    } else {
      deck = rebuildImportedDeck(turnLog);
      drawnCards = [];
      currentCard = null;
      const lastTurn = turnLog.at(-1);
      lastDrawnCardId = lastTurn
        ? allCards.find(card => card.prompt === lastTurn.cardPrompt && card.category === lastTurn.category && card.intensity === lastTurn.intensity)?.id ?? null
        : null;
      eventSource = buildEventSource(players);
      appliedEvents = [];
      duplicatesIgnored = 0;
      streamStatus = 'idle';
    }
    canUndo = false;
    undoData = null;
    startAttempted = false;
    return null;
  }

  function importFromText(text: string): ToolResult {
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch { return { ok: false, message: 'Invalid session file: the content is not valid JSON' }; }
    const err = applyImportedPayload(parsed);
    if (err) return { ok: false, message: `Invalid session file: ${err}` };
    safeRemove(KEY_CHECKPOINT);
    hasCheckpoint = false;
    showToast('Session imported successfully', 'success');
    return { ok: true, message: 'Session imported', players: [...players] };
  }

  function handleImportFile(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = importFromText(String(ev.target?.result ?? ''));
      if (!res.ok) showToast(res.message, 'error');
    };
    reader.onerror = () => showToast('Invalid session file: could not read the file', 'error');
    reader.readAsText(file);
  }

  // ============ SAVE / RESUME ============
  function handleSaveProgress() {
    if (turnLog.length === 0 || winner) return;
    const checkpoint = {
      ...exportSession(),
      customCardState: customCards,
      currentCard,
      deck,
      drawnCardIds: drawnCards.map(c => c.id),
      lastDrawnCardId,
      timeLeft,
    };
    safeSet(KEY_CHECKPOINT, checkpoint);
    hasCheckpoint = true;
    showToast('Saved progress', 'success');
  }

  function resumeFromCheckpoint() {
    const checkpoint = safeGet<any>(KEY_CHECKPOINT, null);
    if (!checkpoint) return;
    const err = applyImportedPayload(checkpoint);
    if (err) { showToast(`Could not resume: ${err}`, 'error'); return; }
    // Export payloads intentionally omit storage-only ids, but checkpoints keep
    // the full custom-card records so deck/current-card references remain stable
    // across resume. Only reuse an id when all schema fields still match.
    if (Array.isArray(checkpoint.customCardState) && checkpoint.customCardState.length === customCards.length) {
      const restored = customCards.map((card, index) => {
        const saved = checkpoint.customCardState[index];
        if (!isRecord(saved) || typeof saved.id !== 'string') return null;
        if (saved.prompt !== card.prompt || saved.category !== card.category || saved.intensity !== card.intensity) return null;
        return { ...card, id: saved.id, isCustom: true } satisfies Card;
      });
      if (restored.every((card): card is Card => card !== null)) {
        customCards = restored;
        saveCustomCards();
      }
    }
    // restore on-screen card + deck from the checkpoint snapshot
    if (checkpoint.deck && Array.isArray(checkpoint.deck)) deck = checkpoint.deck;
    const available = [...BUILT_IN_CARDS, ...customCards];
    drawnCards = (checkpoint.drawnCardIds ?? []).map((id: string) => available.find(c => c.id === id)).filter(Boolean) as Card[];
    currentCard = checkpoint.currentCard ?? null;
    lastDrawnCardId = checkpoint.lastDrawnCardId ?? currentCard?.id ?? null;
    if (phase === 'finished') stopStream();
    else if (currentCard && timerEnabled) startTimer(Number.isInteger(checkpoint.timeLeft) ? checkpoint.timeLeft : 15);
    showToast('Saved session resumed', 'success');
  }

  // ============ PERSISTENCE (auto-save everything on change) ============
  function persistGameState() {
    safeSet(KEY_GAME, {
      phase,
      players,
      currentPlayerIndex,
      scores,
      selectedCategories,
      selectedIntensity,
      timerEnabled,
      turnLog,
      deck,
      drawnCardIds: drawnCards.map(c => c.id),
      currentCard,
      lastDrawnCardId,
      timeLeft,
      setupPlayerNames,
    });
  }

  function initFromStorage() {
    if (isInitialized) return;
    customCards = safeGet<Card[]>(KEY_CARDS, []);
    bestRecord = safeGet<{ name: string; points: number } | null>(KEY_RECORD, null);
    const checkpoint = safeGet<any>(KEY_CHECKPOINT, null);
    const saved = safeGet<any>(KEY_GAME, null);

    if (saved && (saved.phase === 'playing' || saved.phase === 'finished') && Array.isArray(saved.players) && saved.players.length >= 2) {
      players = saved.players;
      currentPlayerIndex = Math.min(saved.currentPlayerIndex ?? 0, players.length - 1);
      scores = saved.scores ?? {};
      selectedCategories = (saved.selectedCategories?.length ? saved.selectedCategories : ['Icebreaker', 'Truth', 'Dare', 'Wild']);
      selectedIntensity = saved.selectedIntensity ?? 'Mild';
      timerEnabled = !!saved.timerEnabled;
      turnLog = Array.isArray(saved.turnLog) ? saved.turnLog : [];
      deck = Array.isArray(saved.deck) ? saved.deck : buildDeck();
      const available = [...BUILT_IN_CARDS, ...customCards];
      drawnCards = (saved.drawnCardIds ?? []).map((id: string) => available.find(c => c.id === id)).filter(Boolean) as Card[];
      currentCard = saved.currentCard ?? null;
      lastDrawnCardId = saved.lastDrawnCardId ?? currentCard?.id ?? null;
      timeLeft = Number.isInteger(saved.timeLeft) ? Math.max(1, Math.min(15, saved.timeLeft)) : 15;
      setupPlayerNames = [...players];
      phase = (saved.phase === 'finished' || players.some(p => (scores[p]?.points ?? 0) >= WIN_TARGET)) ? 'finished' : 'playing';
      canUndo = false;
      undoData = null;
      eventSource = buildEventSource(players);
      appliedEvents = [];
      duplicatesIgnored = 0;
      streamStatus = 'idle';
      if (currentCard && timerEnabled && phase === 'playing') startTimer(timeLeft);
    } else {
      phase = 'setup';
      const roster: string[] = (saved && Array.isArray(saved.setupPlayerNames) && saved.setupPlayerNames.some((n: any) => String(n).trim()))
        ? saved.setupPlayerNames.map((n: any) => String(n))
        : (checkpoint && Array.isArray(checkpoint.players) ? checkpoint.players.map((p: any) => String(p.name)) : ['', '']);
      setupPlayerNames = roster.length >= 2 ? [...roster] : [...roster, ...Array.from({ length: 2 - roster.length }, () => '')];
      selectedCategories = (saved?.selectedCategories?.length ? saved.selectedCategories : checkpoint?.categories?.length ? checkpoint.categories : ['Icebreaker', 'Truth', 'Dare', 'Wild']);
      selectedIntensity = saved?.selectedIntensity ?? checkpoint?.intensity ?? 'Mild';
      timerEnabled = saved?.timerEnabled ?? checkpoint?.roundTimer ?? false;
    }

    hasCheckpoint = !!checkpoint;
    isInitialized = true;
  }

  initFromStorage();

  // Any change to shared state persists the live session (covers mid-game reload
  // without an explicit Save Progress — criterion 4.3 / 14.1).
  $effect(() => {
    if (!isInitialized) return;
    // read every persisted field so the effect re-runs on any mutation
    void phase; void players; void currentPlayerIndex; void scores; void selectedCategories;
    void selectedIntensity; void timerEnabled; void turnLog; void deck; void drawnCards;
    void currentCard; void lastDrawnCardId; void timeLeft; void setupPlayerNames;
    persistGameState();
  });

  // ============ WEBMCP ============
  let webmcpReady = $state(false);
  $effect(() => {
    if (webmcpReady || typeof window === 'undefined') return;
    const actions: WebmcpActions = {
      streamStart, streamPause, streamResume, streamStop, streamRestart,
      streamAdvance, streamDeliverOutOfOrder, streamReconnect, streamDisconnect,
      entityCreate: (a) => {
        const entity = String(a.entity ?? 'card');
        if (entity === 'player') return addSetupPlayer(String(a.name ?? ''));
        return addCustomCard(String(a.prompt ?? ''), (a.category as Category) ?? 'Dare', (a.intensity as Intensity) ?? 'Mild');
      },
      entitySelect: () => {
        if (phase !== 'playing') return { ok: false, message: 'Start a game before drawing a card' };
        const card = drawCard();
        return card ? { ok: true, message: `Drew ${card.category} card`, prompt: card.prompt } : { ok: false, message: 'No card available' };
      },
      entityUpdate: (a) => {
        if (phase !== 'playing' || !currentCard) return { ok: false, message: 'Draw a card before resolving a turn' };
        const outcome = String(a.outcome ?? '').toLowerCase();
        const player = currentPlayer;
        if (outcome === 'done') { handleDone(); return { ok: true, message: `${player} scored a point`, player, points: scores[player]?.points ?? 0 }; }
        if (outcome === 'skip') { handleSkip(); return { ok: true, message: `${player} forfeited`, player, forfeits: scores[player]?.forfeits ?? 0 }; }
        return { ok: false, message: 'outcome must be "done" or "skip"' };
      },
      entityDelete: (a) => {
        const id = String(a.id ?? '');
        if (a.confirm !== true) return { ok: false, message: 'Delete requires confirm=true' };
        if (!customCards.some(c => c.id === id)) return { ok: false, message: `No custom card with id ${id}` };
        deleteCustomCard(id);
        return { ok: true, message: `Deleted custom card ${id}` };
      },
      entityToggle: (a) => {
        const cat = a.category as Category;
        if (!(['Icebreaker', 'Truth', 'Dare', 'Wild'] as Category[]).includes(String(cat) as Category)) return { ok: false, message: 'Unknown category' };
        toggleCategory(cat);
        return { ok: true, message: `Toggled ${cat}`, selected: [...selectedCategories] };
      },
      formValidate: (a) => {
        const form = String(a.form ?? 'setup');
        if (form === 'custom-card') {
          const text = String(a.prompt ?? '').trim();
          if (text.length < 8 || text.length > 200) return { ok: false, message: 'Field prompt must be 8 to 200 characters' };
          return { ok: true, message: 'Custom card is valid' };
        }
        return validateSetup();
      },
      formSubmit: (a) => {
        const form = String(a.form ?? 'setup');
        if (form === 'custom-card') return addCustomCard(String(a.prompt ?? ''), (a.category as Category) ?? 'Dare', (a.intensity as Intensity) ?? 'Mild');
        return submitSetup();
      },
      formCancel: () => {
        if (showNewGameConfirm) { showNewGameConfirm = false; return { ok: true, message: 'New-game confirmation cancelled' }; }
        if (showDeleteConfirm) { showDeleteConfirm = null; return { ok: true, message: 'Delete confirmation cancelled' }; }
        if (showExportPreview) { showExportPreview = false; return { ok: true, message: 'Export preview closed' }; }
        if (showImportDialog) { showImportDialog = false; return { ok: true, message: 'Import dialog closed' }; }
        return { ok: true, message: 'No open dialog to cancel' };
      },
      formReset: () => { newGame(); return { ok: true, message: 'Returned to setup screen' }; },
      artifactExport: () => {
        showExportPreview = true;
        return { ok: true, message: 'Opened session export preview' };
      },
      artifactImport: () => {
        showImportDialog = true;
        return { ok: true, message: 'Opened session import workflow' };
      },
      artifactCopy: () => {
        showExportPreview = true;
        return { ok: true, message: 'Opened export preview for copy' };
      },
    };
    registerWebmcp(actions);
    webmcpReady = true;
  });

  // export payload memo for the preview dialog
  let exportPayload = $derived(exportSession());
</script>

<svelte:window onkeydown={(e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  // Dialogs handle their own Escape; this is a safety net.
}} />

<div class="min-h-screen" style="background-color: var(--color-bg);">
  {#if phase === 'setup'}
    <SetupScreen
      {bestRecord}
      {selectedCategories}
      {selectedIntensity}
      {customCards}
      {timerEnabled}
      {showDeleteConfirm}
      playerNames={setupPlayerNames}
      newPlayerInput={newPlayerInput}
      playerError={playerError}
      categoryError={categoryError}
      startAttempted={startAttempted}
      canStart={canStart}
      {hasCheckpoint}
      onNewPlayerInput={(v) => { newPlayerInput = v; }}
      onAddPlayer={(name) => { addSetupPlayer(name); }}
      onRemovePlayer={(i) => { removeSetupPlayer(i); }}
      onUpdatePlayerName={(i, v) => { updateSetupPlayerName(i, v); }}
      onToggleCategory={(cat) => { toggleCategory(cat); }}
      onSetCategories={(cats) => { setCategories(cats); }}
      onUpdateIntensity={(int) => { selectedIntensity = int; }}
      onStartGame={() => { submitSetup(); }}
      onToggleTimer={() => { timerEnabled = !timerEnabled; }}
      onAddCustomCard={(data) => { addCustomCard(data.prompt, data.category, data.intensity); }}
      onShowDeleteConfirm={(id) => { showDeleteConfirm = id; }}
      onExportSession={handleExportSession}
      onCopySession={handleCopySession}
      onImportSession={() => { showImportDialog = true; }}
      onImportFile={handleImportFile}
      onResumeSavedSession={resumeFromCheckpoint}
    />
  {:else}
    <GameScreen
      {players}
      {currentPlayer}
      {winner}
      {sortedScores}
      {currentCard}
      {canUndo}
      {reshuffleMessage}
      {timerEnabled}
      {timeLeft}
      {bestRecord}
      {hasCheckpoint}
      streamStatus={streamStatus}
      appliedEvents={appliedEvents}
      bonuses={bonuses}
      offeredEvent={offeredEvent}
      deliveredCount={appliedEvents.length}
      totalEvents={eventSource.length}
      duplicatesIgnored={duplicatesIgnored}
      turnLogCount={turnLog.length}
      onDrawCard={() => { drawCard(); }}
      onDone={() => { handleDone(); }}
      onSkip={() => { handleSkip(); }}
      onUndo={() => { undoLastTurn(); }}
      onNewGame={() => { showNewGameConfirm = true; }}
      onStreamStart={() => { streamStart(); }}
      onStreamPause={() => { streamPause(); }}
      onStreamReconnect={() => { streamReconnect(); }}
      onStreamDeliverOutOfOrder={() => { streamDeliverOutOfOrder(); }}
      onExportSession={handleExportSession}
      onCopySession={handleCopySession}
      onSaveProgress={handleSaveProgress}
      onResumeSavedSession={resumeFromCheckpoint}
    />
  {/if}

  {#if showNewGameConfirm}
    <Dialog labelId="dlg-newgame" onClose={() => { showNewGameConfirm = false; }}>
      <h2 id="dlg-newgame" class="text-xl font-semibold mb-2.5" style="color: var(--color-accent);">Start New Game?</h2>
      <p class="text-gray-700 mb-5">Start over to clear all players and scores. Your Dare Night record and saved session stay available.</p>
      <div class="flex gap-2.5">
        <button class="flex-1 px-5 py-2.5 rounded-full bg-white border-2 border-black text-black font-semibold hover:bg-gray-50 transition-colors" onclick={() => { showNewGameConfirm = false; }}>Cancel</button>
        <button class="flex-1 px-5 py-2.5 rounded-full font-semibold text-white transition-colors hover:opacity-90" style="background-color: var(--color-accent);" onclick={() => { newGame(); }}>Start new game</button>
      </div>
    </Dialog>
  {/if}

  {#if showDeleteConfirm}
    <Dialog labelId="dlg-delete" onClose={() => { showDeleteConfirm = null; }}>
      <h2 id="dlg-delete" class="text-xl font-semibold mb-2.5" style="color: var(--color-accent);">Delete Custom Card?</h2>
      <p class="text-gray-700 mb-5">This removes the card from your deck and from every saved session. This cannot be undone.</p>
      <div class="flex gap-2.5">
        <button class="flex-1 px-5 py-2.5 rounded-full bg-white border-2 border-black text-black font-semibold hover:bg-gray-50 transition-colors" onclick={() => { showDeleteConfirm = null; }}>Cancel</button>
        <button class="flex-1 px-5 py-2.5 rounded-full font-semibold text-white transition-colors hover:opacity-90" style="background-color: #DC2626;" onclick={() => { if (showDeleteConfirm) deleteCustomCard(showDeleteConfirm); }}>Confirm delete</button>
      </div>
    </Dialog>
  {/if}

  {#if showExportPreview}
    <ExportPreviewDialog payload={exportPayload} onClose={() => { showExportPreview = false; }} onDownload={downloadSessionJson} onCopy={handleCopySession} />
  {/if}

  {#if showImportDialog}
    <ImportSessionDialog
      onClose={() => { showImportDialog = false; }}
      onImportText={(text) => {
        const res = importFromText(text);
        if (res.ok) showImportDialog = false;
        return res;
      }}
      onImportFile={handleImportFile}
    />
  {/if}

  <!-- Toasts -->
  <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2.5 items-center pointer-events-none" aria-live="polite" aria-atomic="false">
    {#each toasts as toast (toast.id)}
      <Toast {toast} />
    {/each}
  </div>
</div>
