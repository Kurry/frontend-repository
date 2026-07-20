<script lang="ts">
  import confetti from 'canvas-confetti';
  import { BUILT_IN_CARDS, shuffleArray, type Card, type Category, type Intensity } from '../lib/cards';
  import { buildEventSource, deriveBonuses, type LiveEvent, type StreamStatus } from '../lib/stream';
  import { registerWebmcp, type ToolResult, type WebmcpActions } from '../lib/webmcp';
  import SetupScreen from './SetupScreen.svelte';
  import GameScreen from './GameScreen.svelte';
  import Toast from './Toast.svelte';

  // Storage helpers that are safe during SSR
  function safeLocalStorageGet<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }

  function safeLocalStorageSet<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

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
  let turnLog = $state<{ playerName: string; outcome: 'done' | 'skip' | 'timeout'; cardPrompt: string; category: string; intensity: string; }[]>([]);
  let canUndo = $state(false);
  let undoData = $state<{
    playerIndex: number;
    scores: Record<string, { points: number; forfeits: number }>;
    card: Card | null;
    lastDrawnCardId: string | null;
    turnLog: typeof turnLog;
  } | null>(null);
  let toasts = $state<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  let toastCounter = $state(0);
  let showNewGameConfirm = $state(false);
  let showDeleteConfirm = $state<string | null>(null);
  let isInitialized = $state(false);
  let hasCheckpoint = $state(false);

  // ---- Setup roster state (lifted so WebMCP shares the UI's code paths) ----
  let setupPlayerNames = $state<string[]>(['', '']);
  let newPlayerInput = $state('');
  let playerError = $state('');
  let categoryError = $state('');
  let startAttempted = $state(false);

  // ---- Live-event stream state ----
  let streamStatus = $state<StreamStatus>('idle');
  let eventSource = $state<LiveEvent[]>([]);
  let appliedEvents = $state<LiveEvent[]>([]);
  let duplicatesIgnored = $state(0);
  let streamInterval = $state<ReturnType<typeof setInterval> | null>(null);

  // ============ DERIVED ============
  let currentPlayer = $derived(players[currentPlayerIndex] ?? '');

  let winner = $derived((() => {
    const w = players.find(p => scores[p]?.points >= 10);
    return w ?? null;
  })());

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
    selectedCategories.length > 0 && !setupHasDupes
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
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  // ============ DECK ============
  function buildDeck(): Card[] {
    let filtered = allCards.filter(card => selectedCategories.includes(card.category));
    let mildCards = filtered.filter(c => c.intensity === 'Mild');
    let spicyCards = filtered.filter(c => c.intensity === 'Spicy');
    let wildCards = filtered.filter(c => c.intensity === 'Wild');

    let result: Card[];
    if (selectedIntensity === 'Spicy') {
      result = [...mildCards, ...spicyCards, ...spicyCards, ...wildCards, ...wildCards, ...wildCards];
    } else if (selectedIntensity === 'Wild') {
      result = [...mildCards, ...spicyCards, ...spicyCards, ...wildCards, ...wildCards, ...wildCards, ...wildCards, ...wildCards];
    } else {
      result = [...mildCards, ...mildCards, ...spicyCards, ...wildCards];
    }

    return shuffleArray(result);
  }

  // ============ SETUP ROSTER (shared by UI + WebMCP) ============
  function addSetupPlayer(rawName: string): ToolResult {
    const name = rawName.trim();
    if (!name) {
      playerError = 'Enter a player name';
      return { ok: false, message: playerError };
    }
    if (setupPlayerNames.length >= 8) {
      playerError = 'You can add up to 8 players';
      return { ok: false, message: playerError };
    }
    const allNames = [...setupPlayerNames.map(n => n.trim()), name].filter(Boolean);
    const lower = allNames.map(n => n.toLowerCase());
    if (lower.some((n, i) => lower.indexOf(n) !== i)) {
      playerError = `"${name}" is already in the game — enter a unique name`;
      return { ok: false, message: playerError };
    }
    setupPlayerNames = [...setupPlayerNames, name];
    newPlayerInput = '';
    playerError = '';
    return { ok: true, message: `Added ${name}`, roster: [...validSetupPlayers] };
  }

  function removeSetupPlayer(index: number) {
    setupPlayerNames = setupPlayerNames.filter((_, i) => i !== index);
    playerError = '';
  }

  function updateSetupPlayerName(index: number, value: string) {
    setupPlayerNames = setupPlayerNames.map((n, i) => i === index ? value : n);
    const nonEmpty = setupPlayerNames.filter(n => n.trim());
    const lower = nonEmpty.map(n => n.toLowerCase());
    if (lower.some((n, i) => lower.indexOf(n) !== i)) {
      const dup = nonEmpty.find((n, i) => lower.indexOf(n.toLowerCase()) !== i);
      playerError = `Duplicate name detected: "${dup ?? ''}"`;
    } else {
      playerError = '';
    }
  }

  function toggleCategory(cat: Category) {
    if (selectedCategories.includes(cat)) {
      selectedCategories = selectedCategories.filter(c => c !== cat);
    } else {
      selectedCategories = [...selectedCategories, cat];
    }
    categoryError = '';
  }

  function setCategories(cats: Category[]) {
    selectedCategories = cats;
    categoryError = '';
  }

  function validateSetup(): ToolResult {
    startAttempted = true;
    if (validSetupPlayers.length < 2) {
      playerError = 'Add at least 2 players';
      return { ok: false, message: playerError };
    }
    if (setupHasDupes) {
      playerError = 'Enter a unique name for each player';
      return { ok: false, message: playerError };
    }
    if (selectedCategories.length === 0) {
      categoryError = 'Select at least one category';
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
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem('dare-night-checkpoint');
    } catch { /* ignore */ }
    hasCheckpoint = false;
    players = [...playerNames];
    currentPlayerIndex = 0;
    const newScores: Record<string, { points: number; forfeits: number }> = {};
    for (const name of playerNames) {
      newScores[name] = { points: 0, forfeits: 0 };
    }
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
    persistGameState();
    saveCustomCards();
  }

  function drawCard(): Card | undefined {
    if (phase !== 'playing' || winner) return undefined;
    if (deck.length === 0) {
      deck = buildDeck();
      drawnCards = [];
      reshuffleMessage = true;
      showToast('Deck reshuffled!', 'info');
      setTimeout(() => { reshuffleMessage = false; }, 2000);
    }

    let card: Card | undefined;
    if (lastDrawnCardId && deck.length > 1) {
      const idx = deck.findIndex(c => c.id !== lastDrawnCardId);
      if (idx >= 0) {
        card = deck.splice(idx, 1)[0];
      } else {
        card = deck.pop();
      }
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

  function startTimer() {
    stopTimer();
    if (!timerEnabled) return;
    timeLeft = 15;
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        stopTimer();
        handleTimerForfeit();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function saveUndoState() {
    undoData = {
      playerIndex: currentPlayerIndex,
      scores: JSON.parse(JSON.stringify(scores)),
      card: currentCard,
      lastDrawnCardId: lastDrawnCardId,
      turnLog: [...turnLog],
    };
  }

  function handleTimerForfeit() {
    if (phase !== 'playing' || winner) return;
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'timeout', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      canUndo = true;
      showToast(`${playerName}: time's up! Forfeit recorded.`, 'error');
      advanceTurn();
      persistGameState();
    }
  }

  function handleDone() {
    if (phase !== 'playing' || winner) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], points: scores[playerName].points + 1 } };
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'done', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      canUndo = true;
      showToast(`${playerName} scored! +1 point`, 'success');
      const setNewRecord = updateBestRecord();
      if (scores[playerName].points >= 10) {
        phase = 'finished';
        currentCard = null;
        canUndo = false;
        stopStream();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
        }
        persistGameState();
        return;
      }
      if (setNewRecord && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
      }
      advanceTurn();
      persistGameState();
    }
  }

  function handleSkip() {
    if (phase !== 'playing' || winner) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'skip', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      canUndo = true;
      showToast(`${playerName} skipped. Forfeit recorded.`, 'info');
      advanceTurn();
      persistGameState();
    }
  }

  function advanceTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    currentCard = null;
  }

  function undoLastTurn() {
    if (!canUndo || !undoData) return;
    currentPlayerIndex = undoData.playerIndex;
    scores = JSON.parse(JSON.stringify(undoData.scores));
    currentCard = undoData.card;
    lastDrawnCardId = undoData.lastDrawnCardId;
    turnLog = [...undoData.turnLog];
    if (drawnCards.length > 0) {
      drawnCards = drawnCards.slice(0, -1);
    }
    canUndo = false;
    undoData = null;
    stopTimer();
    showToast('Last turn undone!', 'info');
    persistGameState();
  }

  function updateBestRecord(): boolean {
    let updated = false;
    for (const playerName of players) {
      const pts = scores[playerName]?.points ?? 0;
      if (pts > 0 && (!bestRecord || pts > bestRecord.points)) {
        bestRecord = { name: playerName, points: pts };
        safeLocalStorageSet('dare-night-best-record', bestRecord);
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
    eventSource = [];
    appliedEvents = [];
    duplicatesIgnored = 0;
    streamStatus = 'idle';
    clearGameState();
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem('dare-night-checkpoint');
    } catch { /* ignore */ }
    hasCheckpoint = false;
  }

  // ============ CUSTOM CARDS ============
  function addCustomCard(prompt: string, category: Category, intensity: Intensity): ToolResult {
    const text = (prompt ?? '').trim();
    if (text.length < 5) {
      return { ok: false, message: 'Enter at least 5 characters for the card prompt' };
    }
    const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const card: Card = { id, prompt: text, category, intensity, isCustom: true };
    customCards = [...customCards, card];
    saveCustomCards();
    showToast('Custom card added!', 'success');
    return { ok: true, message: 'Custom card added', id };
  }

  function deleteCustomCard(id: string) {
    customCards = customCards.filter(c => c.id !== id);
    saveCustomCards();
    showToast('Custom card deleted.', 'info');
    showDeleteConfirm = null;
  }

  function saveCustomCards() {
    safeLocalStorageSet('dare-night-custom-cards', customCards);
  }

  // ============ LIVE-EVENT STREAM ============
  function initStream() {
    stopStream();
    eventSource = buildEventSource(players);
    appliedEvents = [];
    duplicatesIgnored = 0;
    streamStatus = 'idle';
  }

  function applyEvent(ev: LiveEvent): boolean {
    if (appliedEvents.some(a => a.id === ev.id)) {
      duplicatesIgnored += 1;
      return false;
    }
    appliedEvents = [...appliedEvents, ev];
    return true;
  }

  function nextInOrderEvent(): LiveEvent | null {
    const applied = new Set(appliedEvents.map(e => e.id));
    const undelivered = eventSource.filter(e => !applied.has(e.id));
    if (undelivered.length === 0) return null;
    return undelivered.reduce((lo, e) => (e.seq < lo.seq ? e : lo), undelivered[0]);
  }

  function allDelivered(): boolean {
    return eventSource.length > 0 && appliedEvents.length >= eventSource.length;
  }

  function stopStream() {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
  }

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

  function streamPause(): ToolResult {
    stopStream();
    streamStatus = 'paused';
    return { ok: true, message: 'Live stream paused', status: streamStatus };
  }

  function streamResume(): ToolResult {
    return streamStart();
  }

  function streamStop(): ToolResult {
    stopStream();
    appliedEvents = [];
    duplicatesIgnored = 0;
    streamStatus = 'idle';
    return { ok: true, message: 'Live stream stopped and reset', status: streamStatus };
  }

  function streamRestart(): ToolResult {
    stopStream();
    appliedEvents = [];
    duplicatesIgnored = 0;
    return streamStart();
  }

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
    const applied = applyEvent(ev);
    if (allDelivered()) streamStatus = 'caught-up';
    return { ok: applied, message: applied ? `Delivered ${ev.id} out of order` : `${ev.id} already applied (ignored)`, applied: appliedEvents.length };
  }

  function streamReconnect(): ToolResult {
    stopStream();
    streamStatus = 'disconnected';
    const applied = new Set(appliedEvents.map(e => e.id));
    const missed = eventSource
      .filter(e => !applied.has(e.id))
      .sort((a, b) => a.seq - b.seq);
    for (const ev of missed) applyEvent(ev);
    streamStatus = 'caught-up';
    return { ok: true, message: `Reconnected; caught up ${missed.length} events`, applied: appliedEvents.length };
  }

  function streamDisconnect(): ToolResult {
    stopStream();
    streamStatus = 'disconnected';
    return { ok: true, message: 'Live stream disconnected', status: streamStatus };
  }

  // ============ EXPORT / IMPORT ============
  function exportSession() {
    const sessionPlayers = phase === 'setup' ? validSetupPlayers : players;
    const payload = {
      schemaVersion: 'dare-night-session-v1',
      status: winner ? 'finished' : (phase === 'setup' ? 'setup' : 'playing'),
      players: sessionPlayers.map(name => ({
        name,
        points: scores[name]?.points ?? 0,
        forfeits: scores[name]?.forfeits ?? 0,
      })),
      categories: selectedCategories,
      intensity: selectedIntensity,
      roundTimer: timerEnabled,
      currentTurnIndex: currentPlayerIndex,
      winTarget: 10,
      winner: winner,
      customCards: customCards.map(({ prompt, category, intensity }) => ({ prompt, category, intensity })),
      record: bestRecord ? { holder: bestRecord.name, points: bestRecord.points } : null,
      turnLog,
      exportedAt: new Date().toISOString(),
    };
    return payload;
  }

  function handleExportSession() {
    const payload = exportSession();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dare-night-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopySession() {
    const payload = exportSession();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      .then(() => showToast('Copied session JSON to clipboard', 'info'))
      .catch(() => showToast('Failed to copy session JSON', 'error'));
  }

  function handleImportSession(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const payload = JSON.parse(text);
        if (payload.schemaVersion !== 'dare-night-session-v1') throw new Error('Wrong schemaVersion');
        if (!['setup', 'playing', 'finished'].includes(payload.status) || !Array.isArray(payload.players) || !payload.categories || !payload.intensity || typeof payload.roundTimer !== 'boolean' || typeof payload.currentTurnIndex !== 'number' || payload.winTarget !== 10 || !('winner' in payload) || !Array.isArray(payload.customCards) || !Array.isArray(payload.turnLog)) {
          throw new Error('Missing required fields');
        }
        if (payload.players.length < 2 || payload.players.length > 8) {
          throw new Error('players must contain 2 to 8 entries');
        }
        if (!Number.isInteger(payload.currentTurnIndex) || payload.currentTurnIndex < 0 || payload.currentTurnIndex >= payload.players.length) {
          throw new Error('currentTurnIndex must identify an imported player');
        }

        const winningPlayer = payload.players.find((player: any) => player.points >= payload.winTarget);
        if (payload.status === 'finished' && (!winningPlayer || payload.winner !== winningPlayer.name)) {
          throw new Error('finished status requires a matching winner at the win target');
        }
        if (payload.status !== 'finished' && (winningPlayer || payload.winner !== null)) {
          throw new Error('unfinished status cannot include a winner');
        }

        // Apply imported state
        players = payload.players.map((p: any) => p.name);
        scores = payload.players.reduce((acc: any, p: any) => {
          acc[p.name] = { points: p.points, forfeits: p.forfeits };
          return acc;
        }, {});
        currentPlayerIndex = payload.currentTurnIndex;
        selectedCategories = payload.categories;
        selectedIntensity = payload.intensity;
        timerEnabled = payload.roundTimer;
        turnLog = payload.turnLog;
        if (payload.record) {
          bestRecord = { name: payload.record.holder, points: payload.record.points };
          safeLocalStorageSet('dare-night-best-record', bestRecord);
        }

        // Custom cards
        customCards = payload.customCards.map((c: any, i: number) => ({
          id: `custom-${Date.now()}-${i}`,
          prompt: c.prompt,
          category: c.category,
          intensity: c.intensity,
          isCustom: true
        }));
        safeLocalStorageSet('dare-night-custom-cards', customCards);

        phase = payload.status;
        if (phase === 'setup') {
          setupPlayerNames = players.length >= 2
            ? [...players]
            : [...players, ...Array.from({ length: 2 - players.length }, () => '')];
        }

        // Rebuild deck if necessary or just clear current state for safety as we don't serialize deck order
        if (phase !== 'setup') {
          deck = shuffleArray(buildDeck());
          drawnCards = [];
          currentCard = null;
          eventSource = buildEventSource(players);
          appliedEvents = [];
          duplicatesIgnored = 0;
          streamStatus = 'idle';
        }
        
        canUndo = false;
        undoData = null;
        startAttempted = false;
        try {
          if (typeof window !== 'undefined') window.localStorage.removeItem('dare-night-checkpoint');
        } catch { /* ignore */ }
        hasCheckpoint = false;
        persistGameState();
        
        showToast('Session imported successfully!', 'success');
      } catch (err: any) {
        showToast(`Import failed: invalid file (${err.message})`, 'error');
      }
      target.value = ''; // Reset input
    };
    reader.readAsText(file);
  }

  // ============ PERSISTENCE ============
  function persistGameState() {
    const gameState = {
      phase,
      players,
      currentPlayerIndex,
      scores,
      selectedCategories,
      selectedIntensity,
      deck,
      drawnCardIds: drawnCards.map(c => c.id),
      currentCard,
      lastDrawnCardId,
      bestRecord,
      timerEnabled,
      turnLog,
    };
    safeLocalStorageSet('dare-night-game', gameState);
  }

  function clearGameState() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('dare-night-game');
      }
    } catch { /* ignore */ }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (showNewGameConfirm) {
        showNewGameConfirm = false;
      }
      if (showDeleteConfirm) {
        showDeleteConfirm = null;
      }
    }
  }

  // Initialize from localStorage — runs once
  function initFromStorage() {
    if (isInitialized) return;

    const savedCustom = safeLocalStorageGet<Card[]>('dare-night-custom-cards', []);
    if (savedCustom.length > 0) {
      customCards = savedCustom;
    }

    const savedRecord = safeLocalStorageGet<{ name: string; points: number } | null>('dare-night-best-record', null);
    if (savedRecord) {
      bestRecord = savedRecord;
    }

    const checkpoint = safeLocalStorageGet<any>('dare-night-checkpoint', null);
    const saved = safeLocalStorageGet<any>('dare-night-game', null);
    if (saved?.phase === 'setup' && Array.isArray(saved.players)) {
      players = saved.players;
      setupPlayerNames = players.length >= 2
        ? [...players]
        : [...players, ...Array.from({ length: 2 - players.length }, () => '')];
      scores = saved.scores ?? {};
      phase = 'setup';
      selectedCategories = saved.selectedCategories ?? ['Icebreaker', 'Truth', 'Dare', 'Wild'];
      selectedIntensity = saved.selectedIntensity ?? 'Mild';
      bestRecord = saved.bestRecord ?? bestRecord;
      timerEnabled = saved.timerEnabled ?? false;
      turnLog = saved.turnLog ?? [];
      canUndo = false;
      undoData = null;
    } else if (saved && (saved.phase === 'playing' || saved.phase === 'finished') && saved.players && saved.players.length >= 2) {
      players = saved.players;
      currentPlayerIndex = saved.currentPlayerIndex ?? 0;
      scores = saved.scores ?? {};
      phase = players.some(name => scores[name]?.points >= 10) ? 'finished' : 'playing';
      selectedCategories = saved.selectedCategories ?? ['Icebreaker', 'Truth', 'Dare', 'Wild'];
      selectedIntensity = saved.selectedIntensity ?? 'Mild';
      deck = saved.deck ?? [];
      const allAvailable = [...BUILT_IN_CARDS, ...savedCustom];
      drawnCards = (saved.drawnCardIds ?? []).map((id: string) => allAvailable.find(c => c.id === id)).filter(Boolean) as Card[];
      currentCard = saved.currentCard ?? null;
      lastDrawnCardId = saved.lastDrawnCardId ?? null;
      bestRecord = saved.bestRecord ?? bestRecord;
      timerEnabled = saved.timerEnabled ?? false;
      turnLog = saved.turnLog ?? [];
      canUndo = false;
      undoData = null;
      // Live stream is ephemeral; initialize a fresh source for the restored roster.
      eventSource = buildEventSource(players);
      appliedEvents = [];
      duplicatesIgnored = 0;
      streamStatus = 'idle';
    }

    if (checkpoint) {
      hasCheckpoint = true;
    }

    isInitialized = true;
  }

  function handleSaveProgress() {
    if (turnLog.length === 0 || winner) return;
    const payload = {
      ...exportSession(),
      customCardState: customCards,
      currentCard,
      deck,
      drawnCardIds: drawnCards.map(card => card.id),
      lastDrawnCardId,
    };
    safeLocalStorageSet('dare-night-checkpoint', payload);
    hasCheckpoint = true;
    showToast('Saved', 'success');
  }

  function handleResumeSavedSession() {
    const checkpoint = safeLocalStorageGet<any>('dare-night-checkpoint', null);
    if (!checkpoint) return;
    try {
      players = checkpoint.players.map((p: any) => p.name);
      scores = checkpoint.players.reduce((acc: any, p: any) => {
        acc[p.name] = { points: p.points, forfeits: p.forfeits };
        return acc;
      }, {});
      currentPlayerIndex = checkpoint.currentTurnIndex;
      selectedCategories = checkpoint.categories;
      selectedIntensity = checkpoint.intensity;
      timerEnabled = checkpoint.roundTimer;
      turnLog = checkpoint.turnLog;
      customCards = checkpoint.customCardState ?? checkpoint.customCards.map((card: any, index: number) => ({
          id: `custom-${Date.now()}-${index}`,
          prompt: card.prompt,
          category: card.category,
          intensity: card.intensity,
          isCustom: true,
        }));
      saveCustomCards();
      if (checkpoint.record) {
        bestRecord = { name: checkpoint.record.holder, points: checkpoint.record.points };
        safeLocalStorageSet('dare-night-best-record', bestRecord);
      }
      phase = 'playing';
      deck = checkpoint.deck ?? shuffleArray(buildDeck());
      const availableCards = [...BUILT_IN_CARDS, ...customCards];
      drawnCards = (checkpoint.drawnCardIds ?? [])
        .map((id: string) => availableCards.find(card => card.id === id))
        .filter(Boolean) as Card[];
      currentCard = checkpoint.currentCard ?? null;
      lastDrawnCardId = checkpoint.lastDrawnCardId ?? currentCard?.id ?? null;
      if (currentCard && timerEnabled) startTimer();
      else stopTimer();
      eventSource = buildEventSource(players);
      appliedEvents = [];
      duplicatesIgnored = 0;
      streamStatus = 'idle';
      persistGameState();
      showToast('Session resumed', 'success');
    } catch (err) {
      showToast('Failed to resume session', 'error');
    }
  }

  initFromStorage();

  // Persist game state when it changes during play
  $effect(() => {
    if (phase === 'playing' && isInitialized) {
      persistGameState();
    }
  });

  // ============ WEBMCP registration (runs once on the client) ============
  let webmcpReady = $state(false);
  $effect(() => {
    if (webmcpReady || typeof window === 'undefined') return;
    const actions: WebmcpActions = {
      streamStart, streamPause, streamResume, streamStop, streamRestart,
      streamAdvance, streamDeliverOutOfOrder, streamReconnect, streamDisconnect,
      entityCreate: (a) => {
        const entity = String(a.entity ?? 'card');
        if (entity === 'player') {
          return addSetupPlayer(String(a.name ?? ''));
        }
        return addCustomCard(
          String(a.prompt ?? ''),
          (a.category as Category) ?? 'Dare',
          (a.intensity as Intensity) ?? 'Mild',
        );
      },
      entitySelect: () => {
        if (phase !== 'playing') return { ok: false, message: 'Start a game before drawing a card' };
        const card = drawCard();
        return card
          ? { ok: true, message: `Drew ${card.category} card`, prompt: card.prompt }
          : { ok: false, message: 'No card available' };
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
        if (!['Icebreaker', 'Truth', 'Dare', 'Wild'].includes(String(cat))) return { ok: false, message: 'Unknown category' };
        toggleCategory(cat);
        return { ok: true, message: `Toggled ${cat}`, selected: [...selectedCategories] };
      },
      formValidate: (a) => {
        const form = String(a.form ?? 'setup');
        if (form === 'custom-card') {
          const text = String(a.prompt ?? '').trim();
          if (text.length < 5) return { ok: false, message: 'Enter at least 5 characters for the card prompt' };
          return { ok: true, message: 'Custom card is valid' };
        }
        return validateSetup();
      },
      formSubmit: (a) => {
        const form = String(a.form ?? 'setup');
        if (form === 'custom-card') {
          return addCustomCard(String(a.prompt ?? ''), (a.category as Category) ?? 'Dare', (a.intensity as Intensity) ?? 'Mild');
        }
        return submitSetup();
      },
      formCancel: () => {
        if (showNewGameConfirm) { showNewGameConfirm = false; return { ok: true, message: 'New-game confirmation cancelled' }; }
        if (showDeleteConfirm) { showDeleteConfirm = null; return { ok: true, message: 'Delete confirmation cancelled' }; }
        return { ok: true, message: 'No open dialog to cancel' };
      },
      formReset: () => {
        newGame();
        return { ok: true, message: 'Returned to setup screen' };
      },
    };
    registerWebmcp(actions);
    webmcpReady = true;
  });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

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
      onDeleteCustomCard={(id) => { deleteCustomCard(id); }}
      onShowDeleteConfirm={(id) => { showDeleteConfirm = id; }}
        onExportSession={handleExportSession}
        onCopySession={handleCopySession}
        onImportSession={handleImportSession}
        hasCheckpoint={hasCheckpoint}
        onResumeSavedSession={handleResumeSavedSession}
    />
  {:else}
    <GameScreen
      {players}
      {currentPlayer}
      {sortedScores}
      {currentCard}
      {canUndo}
      {reshuffleMessage}
      {timerEnabled}
      {timeLeft}
      {bestRecord}
      {winner}
      streamStatus={streamStatus}
      appliedEvents={appliedEvents}
      bonuses={bonuses}
      offeredEvent={offeredEvent}
      deliveredCount={appliedEvents.length}
      totalEvents={eventSource.length}
      duplicatesIgnored={duplicatesIgnored}
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
        turnLogCount={turnLog.length}
    />
  {/if}

  <!-- New Game Confirmation -->
  {#if showNewGameConfirm}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="new-game-title">
      <div class="bg-white rounded-lg p-10 max-w-sm mx-4 shadow-2xl">
        <h2 id="new-game-title" class="text-xl font-semibold mb-4 text-black">Start new game?</h2>
        <p class="text-gray-700 mb-8">Start over to clear all players and scores. Your Dare Night record stays saved.</p>
        <div class="flex gap-4">
          <button
            class="flex-1 px-6 py-3 rounded-full bg-white border-2 border-black text-black font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            onclick={() => { showNewGameConfirm = false; }}
          >
            Cancel
          </button>
          <button
            class="flex-1 px-6 py-3 rounded-full font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style="background-color: var(--color-accent);"
            onclick={() => { newGame(); }}
          >
            Start new game
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast Container -->
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
    {#each toasts as toast (toast.id)}
      <Toast {toast} />
    {/each}
  </div>
</div>
