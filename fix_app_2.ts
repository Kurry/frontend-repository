import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

const persistReplacement = `
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
      winner,
      turnLog,
    };
    safeLocalStorageSet('dare-night-game', gameState);
  }
`;
content = content.replace(/function persistGameState\(\) \{[\s\S]*?safeLocalStorageSet\('dare-night-game', gameState\);\n  \}/, persistReplacement);


const initFromStorageReplacement = `
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

    const saved = safeLocalStorageGet<any>('dare-night-game', null);
    if (saved && saved.phase === 'playing' && saved.players && saved.players.length >= 2) {
      phase = saved.phase;
      players = saved.players;
      currentPlayerIndex = saved.currentPlayerIndex ?? 0;
      scores = saved.scores ?? {};
      selectedCategories = saved.selectedCategories ?? ['Icebreaker', 'Truth', 'Dare', 'Wild'];
      selectedIntensity = saved.selectedIntensity ?? 'Mild';
      deck = saved.deck ?? [];
      const allAvailable = [...BUILT_IN_CARDS, ...savedCustom];
      drawnCards = (saved.drawnCardIds ?? []).map((id: string) => allAvailable.find(c => c.id === id)).filter(Boolean) as Card[];
      currentCard = saved.currentCard ?? null;
      lastDrawnCardId = saved.lastDrawnCardId ?? null;
      bestRecord = saved.bestRecord ?? bestRecord;
      timerEnabled = saved.timerEnabled ?? false;
      winner = saved.winner ?? null;
      turnLog = saved.turnLog ?? [];
      canUndo = false;
      undoData = null;
      // Live stream is ephemeral; initialize a fresh source for the restored roster.
      eventSource = buildEventSource(players);
      appliedEvents = [];
      duplicatesIgnored = 0;
      streamStatus = 'idle';
    }

    isInitialized = true;
  }
`;
content = content.replace(/\/\/ Initialize from localStorage — runs once[\s\S]*?isInitialized = true;\n  \}/, initFromStorageReplacement);

// Export JSON feature
const jsonFeature = `

  function exportSessionData() {
    const data = {
      schemaVersion: 'dare-night-session-v1',
      status: winner ? 'finished' : (phase === 'playing' ? 'playing' : 'setup'),
      players: players.map((name) => ({ name, points: scores[name]?.points ?? 0, forfeits: scores[name]?.forfeits ?? 0 })),
      categories: selectedCategories,
      intensity: selectedIntensity,
      roundTimer: timerEnabled,
      currentTurnIndex: currentPlayerIndex,
      winTarget: 10,
      winner: winner,
      customCards: customCards.map(c => ({ prompt: c.prompt, category: c.category, intensity: c.intensity })),
      record: bestRecord ? { holder: bestRecord.name, points: bestRecord.points } : null,
      turnLog: turnLog,
      exportedAt: new Date().toISOString()
    };
    return data;
  }

  function handleExportJSON() {
    const data = exportSessionData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`dare-night-session-\${new Date().toISOString().slice(0, 10)}.json\`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Session exported!', 'success');
  }

  function handleCopyJSON() {
    const data = exportSessionData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      document.execCommand('copy');
      showToast('Copied to clipboard!', 'success');
    });
  }

  function handleImportJSON(data: any) {
    if (!data || data.schemaVersion !== 'dare-night-session-v1' || !data.players || !data.categories || !data.intensity || typeof data.winTarget !== 'number') {
      showToast('Invalid session JSON file', 'error');
      return;
    }

    // restore state
    players = data.players.map((p: any) => p.name);
    setupPlayerNames = [...players];
    const newScores: Record<string, { points: number; forfeits: number }> = {};
    for (const p of data.players) {
      newScores[p.name] = { points: p.points, forfeits: p.forfeits };
    }
    scores = newScores;
    selectedCategories = data.categories;
    selectedIntensity = data.intensity;
    timerEnabled = data.roundTimer ?? false;
    currentPlayerIndex = data.currentTurnIndex ?? 0;
    winner = data.winner ?? null;

    // map custom cards correctly
    const restoredCards: Card[] = [];
    if (data.customCards) {
      data.customCards.forEach((c: any) => {
         const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
         restoredCards.push({ id, prompt: c.prompt, category: c.category, intensity: c.intensity, isCustom: true });
      });
    }
    customCards = restoredCards;

    turnLog = data.turnLog ?? [];
    if (data.record) {
       bestRecord = { name: data.record.holder, points: data.record.points };
       safeLocalStorageSet('dare-night-best-record', bestRecord);
    }

    phase = data.status === 'setup' ? 'setup' : 'playing';

    if (phase === 'playing') {
      deck = buildDeck(); // we can't fully restore deck order but we rebuild
      currentCard = null;
      lastDrawnCardId = null;
      drawnCards = [];
      initStream();
    }

    saveCustomCards();
    persistGameState();
    showToast('Session imported successfully!', 'success');
  }

  function handleResumeSession() {
     const saved = safeLocalStorageGet<any>('dare-night-game', null);
     if (saved && saved.phase === 'playing' && saved.players && saved.players.length >= 2) {
       phase = 'playing';
       players = saved.players;
       currentPlayerIndex = saved.currentPlayerIndex ?? 0;
       scores = saved.scores ?? {};
       selectedCategories = saved.selectedCategories ?? ['Icebreaker', 'Truth', 'Dare', 'Wild'];
       selectedIntensity = saved.selectedIntensity ?? 'Mild';
       deck = saved.deck ?? [];
       const allAvailable = [...BUILT_IN_CARDS, ...customCards];
       drawnCards = (saved.drawnCardIds ?? []).map((id: string) => allAvailable.find(c => c.id === id)).filter(Boolean) as Card[];
       currentCard = saved.currentCard ?? null;
       lastDrawnCardId = saved.lastDrawnCardId ?? null;
       timerEnabled = saved.timerEnabled ?? false;
       winner = saved.winner ?? null;
       turnLog = saved.turnLog ?? [];
       canUndo = false;
       undoData = null;
       eventSource = buildEventSource(players);
       appliedEvents = [];
       duplicatesIgnored = 0;
       streamStatus = 'idle';
       showToast('Session resumed', 'success');
     } else {
       showToast('No saved session found', 'error');
     }
  }

  function handleSaveProgress() {
    persistGameState();
    showToast('Progress Saved', 'success');
  }
`;
content = content.replace("// ============ WEBMCP registration (runs once on the client) ============", jsonFeature + "\n  // ============ WEBMCP registration (runs once on the client) ============");


// Props for SetupScreen
content = content.replace(
  "onShowDeleteConfirm={(id) => { showDeleteConfirm = id; }}",
  `onShowDeleteConfirm={(id) => { showDeleteConfirm = id; }}
      onExportJSON={handleExportJSON}
      onImportJSON={handleImportJSON}
      onResumeSession={handleResumeSession}
      hasSavedSession={safeLocalStorageGet('dare-night-game', null)?.phase === 'playing'}
`
);

// Props for GameScreen
content = content.replace(
  "onStreamDeliverOutOfOrder={() => { streamDeliverOutOfOrder(); }}",
  `onStreamDeliverOutOfOrder={() => { streamDeliverOutOfOrder(); }}
      onExportJSON={handleExportJSON}
      onCopyJSON={handleCopyJSON}
      onSaveProgress={handleSaveProgress}
      winner={winner}
      turnLogLength={turnLog.length}
`
);


fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
