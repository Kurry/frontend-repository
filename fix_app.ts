import * as fs from 'fs';

let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// We need to add turnLog, winner to state
// turnLog (array of objects each with playerName, outcome as exactly one of done, skip, timeout, cardPrompt, category, and intensity)

// 1. imports
content = content.replace(
  "import Toast from './Toast.svelte';",
  `import Toast from './Toast.svelte';\n  import confetti from 'canvas-confetti';`
);

// 2. Add state
const stateReplacement = `
  let lastDrawnCardId = $state<string | null>(null);
  let reshuffleMessage = $state(false);
  let winner = $state<string | null>(null);
  let turnLog = $state<{playerName: string; outcome: 'done' | 'skip' | 'timeout'; cardPrompt: string; category: string; intensity: string;}[]>([]);
`;
content = content.replace("  let lastDrawnCardId = $state<string | null>(null);\n  let reshuffleMessage = $state(false);", stateReplacement);

// Update undoData
const undoReplacement = `
  let undoData = $state<{
    playerIndex: number;
    scores: Record<string, { points: number; forfeits: number }>;
    card: Card | null;
    lastDrawnCardId: string | null;
    turnLogLength: number;
    winner: string | null;
  } | null>(null);
`;
content = content.replace(/let undoData = \$state<\{[\s\S]*?\} \| null>\(null\);/, undoReplacement);

// 3. GAME START updates
const startGameReplacement = `
  function startGame(playerNames: string[]) {
    players = [...playerNames];
    currentPlayerIndex = 0;
    const newScores: Record<string, { points: number; forfeits: number }> = {};
    for (const name of playerNames) {
      newScores[name] = { points: 0, forfeits: 0 };
    }
    scores = newScores;
    deck = buildDeck();
    drawnCards = [];
    currentCard = null;
    lastDrawnCardId = null;
    winner = null;
    turnLog = [];
    canUndo = false;
    undoData = null;
    phase = 'playing';
    reshuffleMessage = false;
    initStream();
    persistGameState();
    saveCustomCards();
  }
`;
content = content.replace(/function startGame\(playerNames: string\[\]\) \{[\s\S]*?saveCustomCards\(\);\n  \}/, startGameReplacement);

// update undo logic
const saveUndoStateReplacement = `
  function saveUndoState() {
    undoData = {
      playerIndex: currentPlayerIndex,
      scores: JSON.parse(JSON.stringify(scores)),
      card: currentCard,
      lastDrawnCardId: lastDrawnCardId,
      turnLogLength: turnLog.length,
      winner: winner,
    };
  }
`;
content = content.replace(/function saveUndoState\(\) \{[\s\S]*?\}\n  \}/, saveUndoStateReplacement);

const undoLastTurnReplacement = `
  function undoLastTurn() {
    if (!canUndo || !undoData || winner !== null) return;
    currentPlayerIndex = undoData.playerIndex;
    scores = JSON.parse(JSON.stringify(undoData.scores));
    currentCard = undoData.card;
    lastDrawnCardId = undoData.lastDrawnCardId;
    turnLog = turnLog.slice(0, undoData.turnLogLength);
    winner = undoData.winner;
    if (drawnCards.length > 0) {
      drawnCards = drawnCards.slice(0, -1);
    }
    canUndo = false;
    undoData = null;
    stopTimer();
    showToast('Last turn undone!', 'info');
    persistGameState();
  }
`;
content = content.replace(/function undoLastTurn\(\) \{[\s\S]*?persistGameState\(\);\n  \}/, undoLastTurnReplacement);


const newGameReplacement = `
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
    winner = null;
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
  }
`;
content = content.replace(/function newGame\(\) \{[\s\S]*?clearGameState\(\);\n  \}/, newGameReplacement);

// 4. Handle forfeit/skip/done
const handleTimerForfeitReplacement = `
  function handleTimerForfeit() {
    if (winner !== null) return;
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
      canUndo = true;
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'timeout', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      showToast(\`\${playerName}: time's up! Forfeit recorded.\`, 'error');
      advanceTurn();
      persistGameState();
    }
  }
`;
content = content.replace(/function handleTimerForfeit\(\) \{[\s\S]*?persistGameState\(\);\n    \}\n  \}/, handleTimerForfeitReplacement);

const handleDoneReplacement = `
  function handleDone() {
    if (winner !== null) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], points: scores[playerName].points + 1 } };
      canUndo = true;
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'done', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      showToast(\`\${playerName} scored! +1 point\`, 'success');
      updateBestRecord(playerName);

      if (scores[playerName].points >= 10) {
        winner = playerName;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
           confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }

      advanceTurn();
      persistGameState();
    }
  }
`;
content = content.replace(/function handleDone\(\) \{[\s\S]*?persistGameState\(\);\n    \}\n  \}/, handleDoneReplacement);

const updateBestRecordReplacement = `
  function updateBestRecord(playerName: string) {
    const pts = scores[playerName]?.points ?? 0;
    if (!bestRecord || pts > bestRecord.points) {
      if (bestRecord && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({ particleCount: 100, spread: 60, origin: { y: 0.8 }, colors: ['#ff0000', '#00ff00', '#0000ff'] });
      }
      bestRecord = { name: playerName, points: pts };
      safeLocalStorageSet('dare-night-best-record', bestRecord);
    }
  }
`;
content = content.replace(/function updateBestRecord\(\) \{[\s\S]*?safeLocalStorageSet\('dare-night-best-record', bestRecord\);\n      \}\n    \}\n  \}/, updateBestRecordReplacement);

const handleSkipReplacement = `
  function handleSkip() {
    if (winner !== null) return;
    stopTimer();
    const playerName = players[currentPlayerIndex];
    if (playerName && scores[playerName]) {
      saveUndoState();
      scores = { ...scores, [playerName]: { ...scores[playerName], forfeits: scores[playerName].forfeits + 1 } };
      canUndo = true;
      if (currentCard) {
        turnLog = [...turnLog, { playerName, outcome: 'skip', cardPrompt: currentCard.prompt, category: currentCard.category, intensity: currentCard.intensity }];
      }
      showToast(\`\${playerName} skipped. Forfeit recorded.\`, 'info');
      advanceTurn();
      persistGameState();
    }
  }
`;
content = content.replace(/function handleSkip\(\) \{[\s\S]*?persistGameState\(\);\n    \}\n  \}/, handleSkipReplacement);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
