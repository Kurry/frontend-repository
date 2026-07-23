// FandangoFury — shared game state (Svelte 5 runes).
//
// Every view reads from the single `gameState` rune and every mutation flows
// through `game.*` so the Stage map, combat HUD, Cantina, Masks, Fighter
// Settings, the live Campaign JSON export, and the History timeline all update
// together with no reload. Persistence is explicit (savePersisted at each
// mutation site); the persisted record is the Campaign JSON campaign minus the
// run-only fields, plus the saved fighter settings and any mid-run checkpoint.

export interface Enemy {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  type: 'bandit' | 'brute' | 'boss';
  x: number;
  attacking: boolean;
  telegraphing: boolean;
  dead: boolean;
  rewardPesos: number;
  dropsMask: boolean;
  attackCooldown: number;
  hitFlash: boolean;
}

export interface CombatFeedback {
  id: number;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'combo' | 'fiesta' | 'peso' | 'mask';
  timestamp: number;
}

export interface HistorySnapshot {
  id: number;
  parentId: number | null;
  activeChildId: number | null;
  label: string;
  timestamp: number;
  data: string;
}

export interface StageTheme {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  ground: string;
  lantern: string;
  banner: string;
}

export const STAGES: {
  id: number;
  name: string;
  waves: number;
  bossName: string;
  bossHealth: number;
  bossAttack: number;
  banditHealth: number;
  banditAttack: number;
  bruteHealth: number;
  bruteAttack: number;
  pesoReward: number;
  maskDrop: string;
  theme: StageTheme;
}[] = [
  {
    id: 1, name: 'Plaza del Sol', waves: 3, bossName: 'El Bandido', bossHealth: 120, bossAttack: 12,
    banditHealth: 30, banditAttack: 5, bruteHealth: 60, bruteAttack: 8, pesoReward: 50, maskDrop: 'sol-rojo',
    theme: { skyTop: '#1a1430', skyMid: '#4a2c52', skyBot: '#7a3b2e', ground: '#5b3a1a', lantern: '#f4a261', banner: '#e63946' },
  },
  {
    id: 2, name: 'Mercado Nocturno', waves: 4, bossName: 'La Sombra', bossHealth: 200, bossAttack: 18,
    banditHealth: 45, banditAttack: 8, bruteHealth: 80, bruteAttack: 12, pesoReward: 80, maskDrop: 'noche-azul',
    theme: { skyTop: '#0b1622', skyMid: '#15324a', skyBot: '#1c4a52', ground: '#122430', lantern: '#2a9d8f', banner: '#457b9d' },
  },
  {
    id: 3, name: 'Fortaleza Roja', waves: 5, bossName: 'El Rey Bandido', bossHealth: 350, bossAttack: 25,
    banditHealth: 60, banditAttack: 10, bruteHealth: 100, bruteAttack: 16, pesoReward: 120, maskDrop: 'oro-vivo',
    theme: { skyTop: '#180a12', skyMid: '#3a1320', skyBot: '#5a1818', ground: '#2a1010', lantern: '#e9c46a', banner: '#e63946' },
  },
];

export const MASK_DEFS = [
  { id: 'sol-rojo', name: 'Solar Mask', emoji: '☀️', bonus: 'damage' as const, bonusValue: 1.2, furyColor: '#e63946' },
  { id: 'noche-azul', name: 'Luna Mask', emoji: '🌙', bonus: 'speed' as const, bonusValue: 1.3, furyColor: '#457b9d' },
  { id: 'oro-vivo', name: 'Fuego Mask', emoji: '🔥', bonus: 'defense' as const, bonusValue: 1.25, furyColor: '#f4a261' },
];

export const UPGRADES = [
  { id: 'maxHealth', name: 'Max Health', baseCost: 30, costMultiplier: 1.8, maxLevel: 10, effect: (lvl: number) => 100 + lvl * 20 },
  { id: 'attackPower', name: 'Attack Power', baseCost: 40, costMultiplier: 1.8, maxLevel: 10, effect: (lvl: number) => 10 + lvl * 5 },
  { id: 'furyGain', name: 'Fury Gain Rate', baseCost: 35, costMultiplier: 1.8, maxLevel: 8, effect: (lvl: number) => 8 + lvl * 3 },
];

const STORAGE_KEY = 'fandangoFury';
let feedbackId = 0;
let enemyId = 0;
let historyIdSeq = 0;
let toastId = 0;
let pulseId = 0;
let runGeneration = 0;

function scheduleRun(delay: number, callback: () => void) {
  const generation = runGeneration;
  const run = () => {
    if (generation !== runGeneration) return;
    if (gameState.paused) {
      setTimeout(run, 50);
      return;
    }
    callback();
  };
  setTimeout(run, delay);
}

// ---- storage, guarded so a build never crashes when storage is blocked -----

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — degrade silently, never crash the app */
  }
}

export interface GameState {
  // persisted campaign fields
  pesos: number;
  currentStage: number;
  unlockedStages: number[];
  completedStages: number[];
  ownedMasks: string[];
  equippedMask: string | null;
  upgrades: Record<string, number>;
  fighterDisplayName: string;
  fighterEffectsIntensity: number;
  checkpoint: Checkpoint | null;
  // run-only fields
  playerHealth: number;
  furyMeter: number;
  blocking: boolean;
  dodging: boolean;
  dodgeCooldown: number;
  playerAttacking: '' | 'light' | 'heavy' | 'fury';
  playerHitFlash: boolean;
  enemies: Enemy[];
  currentWave: number;
  isBoss: boolean;
  combo: { chain: ('light' | 'heavy')[]; count: number; timer: number; lastFiesta: boolean };
  comboDisplay: string;
  fiestaFlash: boolean;
  screenFuryActive: boolean;
  feedbacks: CombatFeedback[];
  runPesos: number;
  runMasks: string[];
  history: HistorySnapshot[];
  historyIndex: number;
  // transient UI signals (not persisted)
  paused: boolean;
  statusMessage: string;
  toast: { id: number; text: string; type: 'success' | 'info' | 'warn' } | null;
  maskEquipToast: string;
  furyDeniedId: number;
  shakeId: number;
  pesosFlashId: number;
  pesosChangeSeq: number;
  levelFlashId: string;
  bossBanner: string;
  showMapHint: boolean;
  showCombatHint: boolean;
}

export interface Checkpoint {
  stageId: number;
  waveIndex: number;
  phase: 'wave' | 'boss';
  fighterHealth: number;
  furyMeter: number;
  pesosEarnedThisRun: number;
  comboCount: number;
}

function defaultPersisted() {
  return {
    pesos: 0,
    currentStage: 1,
    unlockedStages: [1],
    completedStages: [] as number[],
    ownedMasks: [] as string[],
    equippedMask: null as string | null,
    upgrades: { maxHealth: 0, attackPower: 0, furyGain: 0 },
    fighterDisplayName: 'Fandango',
    fighterEffectsIntensity: 100,
    checkpoint: null as Checkpoint | null,
  };
}

function defaultRuntime(): Omit<GameState, keyof ReturnType<typeof defaultPersisted>> {
  return {
    playerHealth: 100,
    furyMeter: 0,
    blocking: false,
    dodging: false,
    dodgeCooldown: 0,
    playerAttacking: '',
    playerHitFlash: false,
    enemies: [],
    currentWave: 1,
    isBoss: false,
    combo: { chain: [], count: 0, timer: 0, lastFiesta: false },
    comboDisplay: '',
    fiestaFlash: false,
    screenFuryActive: false,
    feedbacks: [],
    runPesos: 0,
    runMasks: [],
    history: [],
    historyIndex: -1,
    paused: false,
    statusMessage: '',
    toast: null,
    maskEquipToast: '',
    furyDeniedId: 0,
    shakeId: 0,
    pesosFlashId: 0,
    pesosChangeSeq: 0,
    levelFlashId: '',
    bossBanner: '',
    showMapHint: true,
    showCombatHint: false,
  };
}

function loadPersisted(): ReturnType<typeof defaultPersisted> {
  return { ...defaultPersisted(), ...safeGet(STORAGE_KEY, {}) };
}

function savePersisted() {
  safeSet(STORAGE_KEY, {
    pesos: gameState.pesos,
    currentStage: gameState.currentStage,
    unlockedStages: gameState.unlockedStages,
    completedStages: gameState.completedStages,
    ownedMasks: gameState.ownedMasks,
    equippedMask: gameState.equippedMask,
    upgrades: gameState.upgrades,
    fighterDisplayName: gameState.fighterDisplayName,
    fighterEffectsIntensity: gameState.fighterEffectsIntensity,
    checkpoint: gameState.checkpoint,
  });
}

const persisted = loadPersisted();

export const gameState = $state<GameState>({
  ...defaultPersisted(),
  ...defaultRuntime(),
  ...persisted,
});

export function getMaxHealth(state: GameState = gameState): number {
  const lvl = state.upgrades.maxHealth ?? 0;
  const base = 100 + lvl * 20;
  const mask = MASK_DEFS.find(
    (m) => state.ownedMasks.includes(m.id) && state.equippedMask === m.id && m.bonus === 'defense',
  );
  return mask ? Math.floor(base * mask.bonusValue) : base;
}

export function getAttack(state: GameState = gameState): number {
  const lvl = state.upgrades.attackPower ?? 0;
  const base = 10 + lvl * 5;
  const mask = MASK_DEFS.find(
    (m) => state.ownedMasks.includes(m.id) && state.equippedMask === m.id && m.bonus === 'damage',
  );
  return mask ? Math.floor(base * mask.bonusValue) : base;
}

export function getFuryGain(state: GameState = gameState): number {
  const lvl = state.upgrades.furyGain ?? 0;
  return 8 + lvl * 3;
}

function nearestEnemy(maxX = 900): Enemy | undefined {
  return gameState.enemies
    .filter((e) => !e.dead && e.x <= maxX)
    .sort((a, b) => a.x - b.x)[0];
}

function historyData() {
  return JSON.stringify({
    pesos: gameState.pesos,
    currentStage: gameState.currentStage,
    unlockedStages: [...gameState.unlockedStages],
    completedStages: [...gameState.completedStages],
    ownedMasks: [...gameState.ownedMasks],
    equippedMask: gameState.equippedMask,
    upgrades: { ...gameState.upgrades },
    fighterDisplayName: gameState.fighterDisplayName,
    fighterEffectsIntensity: gameState.fighterEffectsIntensity,
    checkpoint: gameState.checkpoint ? { ...gameState.checkpoint } : null,
  });
}

function pushHistory(label: string) {
  const parent = gameState.historyIndex >= 0 ? gameState.history[gameState.historyIndex] : undefined;
  const parentId = parent ? parent.id : null;

  const snapshot: HistorySnapshot = {
    id: ++historyIdSeq,
    parentId,
    activeChildId: null,
    label,
    timestamp: Date.now(),
    data: historyData(),
  };

  // Branching history: the node we diverge from is *not* discarded. The new
  // snapshot is appended as a fresh child of the current node, so an Undo
  // followed by a different change creates a selectable alternate branch
  // rather than flattening the abandoned states into one timeline.
  let history = [...gameState.history, snapshot];
  if (parentId !== null) {
    history = history.map((h) => (h.id === parentId ? { ...h, activeChildId: snapshot.id } : h));
  }
  if (history.length > 60) history = history.slice(-60);
  gameState.history = history;
  gameState.historyIndex = history.length - 1;
}

function ensureHistoryBaseline() {
  if (gameState.history.length === 0) pushHistory('Campaign baseline');
}

function feedbackAdd(text: string, x: number, y: number, type: CombatFeedback['type']) {
  const id = ++feedbackId;
  gameState.feedbacks = [
    ...gameState.feedbacks.filter((f) => Date.now() - f.timestamp < 1100),
    { id, text, x, y, type, timestamp: Date.now() },
  ];
  if (type === 'combo' || type === 'fiesta') gameState.statusMessage = text;
  setTimeout(() => {
    gameState.feedbacks = gameState.feedbacks.filter((f) => f.id !== id);
  }, 1100);
}

function waveComplete() {
  if (gameState.isBoss) {
    const cs = gameState.currentStage;
    if (!gameState.completedStages.includes(cs)) {
      gameState.completedStages = [...gameState.completedStages, cs];
    }
    const next = cs + 1;
    if (next <= STAGES.length && !gameState.unlockedStages.includes(next)) {
      gameState.unlockedStages = [...gameState.unlockedStages, next];
    }
    pushHistory(`Defeated boss of stage ${cs}`);
    game.clearCheckpoint();
  } else {
    const stage = STAGES[gameState.currentStage - 1];
    if (stage && gameState.currentWave >= stage.waves) {
      pushHistory(`Waves cleared stage ${gameState.currentStage}`);
      game.spawnBoss();
    } else {
      gameState.currentWave += 1;
      pushHistory(`Wave ${gameState.currentWave - 1} cleared`);
      scheduleRun(800, () => {
        // Only spawn if still mid-run (a pause-abandon in the gap must not
        // resurrect enemies on the map).
        if (gameState.playerHealth > 0 && !gameState.isBoss) game.spawnWave();
      });
    }
  }
  savePersisted();
}

function dealDamage(enemy: Enemy, damage: number) {
  gameState.enemies = gameState.enemies.map((e) => {
    if (e.id !== enemy.id) return e;
    const health = Math.max(0, e.health - damage);
    return { ...e, health, hitFlash: true, dead: health <= 0 };
  });

  scheduleRun(160, () => {
    gameState.enemies = gameState.enemies.map((e) =>
      e.id === enemy.id ? { ...e, hitFlash: false } : e,
    );
  });

  const target = gameState.enemies.find((e) => e.id === enemy.id);
  if (target?.dead) {
    gameState.pesos += target.rewardPesos;
    gameState.runPesos += target.rewardPesos;
    gameState.pesosFlashId = ++pulseId;
    gameState.pesosChangeSeq += 1;
    feedbackAdd(`+${target.rewardPesos}₱`, target.x, 120, 'peso');

    if (target.dropsMask || (gameState.isBoss && target.type === 'boss')) {
      const stage = STAGES[gameState.currentStage - 1];
      if (stage && !gameState.ownedMasks.includes(stage.maskDrop)) {
        const md = MASK_DEFS.find((m) => m.id === stage.maskDrop);
        gameState.ownedMasks = [...gameState.ownedMasks, stage.maskDrop];
        gameState.runMasks = [...gameState.runMasks, stage.maskDrop];
        feedbackAdd(`🎭 ${md?.name ?? 'Mask'}!`, target.x, 140, 'mask');
      }
    }

    savePersisted();

    if (gameState.enemies.every((e) => e.dead)) {
      scheduleRun(0, () => waveComplete());
    }
  }
}

function checkFiesta() {
  const chain = gameState.combo.chain;
  if (chain.length >= 3) {
    const last3 = chain.slice(-3);
    if (last3[0] === 'light' && last3[1] === 'light' && last3[2] === 'heavy') {
      gameState.combo = { ...gameState.combo, lastFiesta: true };
      gameState.comboDisplay = 'Fiesta Combo!';
      gameState.fiestaFlash = true;
      gameState.shakeId = ++pulseId;
      feedbackAdd('🎉 Fiesta Combo!', 200, 60, 'fiesta');
      const bonus = Math.floor(getAttack() * 2);
      for (const e of gameState.enemies) {
        if (!e.dead) dealDamage(e, bonus);
      }
      gameState.furyMeter = Math.min(100, gameState.furyMeter + getFuryGain() * 3);
      setTimeout(() => {
        gameState.fiestaFlash = false;
      }, 1200);
    }
  }
}

function enemyStrike(enemy: Enemy) {
  if (gameState.paused || gameState.dodging || enemy.dead) return;
  let dmg = enemy.attack;
  if (gameState.blocking) {
    dmg = Math.floor(dmg * 0.3);
    const mask = MASK_DEFS.find(
      (m) =>
        gameState.ownedMasks.includes(m.id) &&
        gameState.equippedMask === m.id &&
        m.bonus === 'defense',
    );
    if (mask) dmg = Math.max(1, Math.floor(dmg / mask.bonusValue));
  }
  gameState.playerHealth = Math.max(0, gameState.playerHealth - dmg);
  gameState.playerHitFlash = true;
  if (enemy.type === 'boss') gameState.shakeId = ++pulseId;
  feedbackAdd(`-${dmg}`, 100, 160, 'damage');
  scheduleRun(200, () => {
    gameState.playerHitFlash = false;
  });
  if (gameState.playerHealth <= 0) pushHistory('Player defeated');
}

export const game = {
  updateFighterSettings(displayName: string, effectsIntensity: number) {
    ensureHistoryBaseline();
    gameState.fighterDisplayName = displayName.trim();
    gameState.fighterEffectsIntensity = Math.trunc(Number(effectsIntensity));
    savePersisted();
    pushHistory('Update Fighter Settings');
  },

  exportCampaign() {
    return {
      schemaVersion: 'fandangofury.campaign.v1',
      fighter: {
        displayName: gameState.fighterDisplayName,
        effectsIntensity: gameState.fighterEffectsIntensity,
      },
      pesos: gameState.pesos,
      upgrades: {
        maxHealth: gameState.upgrades['maxHealth'] || 0,
        attackPower: gameState.upgrades['attackPower'] || 0,
        furyGain: gameState.upgrades['furyGain'] || 0,
      },
      masks: {
        owned: [...gameState.ownedMasks],
        equipped: gameState.equippedMask || null,
      },
      stages: {
        unlocked: [...gameState.unlockedStages],
        completed: [...gameState.completedStages],
      },
      checkpoint: gameState.checkpoint
        ? { ...gameState.checkpoint }
        : null,
    };
  },

  importCampaign(data: any) {
    ensureHistoryBaseline();
    gameState.fighterDisplayName = String(data.fighter.displayName).trim();
    gameState.fighterEffectsIntensity = Math.trunc(Number(data.fighter.effectsIntensity));
    gameState.pesos = data.pesos;
    gameState.upgrades = { ...data.upgrades };
    gameState.ownedMasks = [...data.masks.owned];
    gameState.equippedMask = data.masks.equipped ?? null;
    gameState.unlockedStages = [...data.stages.unlocked];
    gameState.completedStages = [...data.stages.completed];
    gameState.checkpoint = data.checkpoint ? { ...data.checkpoint } : null;
    savePersisted();
    pushHistory('Import Campaign');
  },

  saveCheckpoint() {
    ensureHistoryBaseline();
    gameState.checkpoint = {
      stageId: gameState.currentStage,
      waveIndex: gameState.currentWave,
      phase: gameState.isBoss ? 'boss' : 'wave',
      fighterHealth: gameState.playerHealth,
      furyMeter: Math.floor(gameState.furyMeter),
      pesosEarnedThisRun: gameState.runPesos,
      comboCount: gameState.combo.count,
    };
    savePersisted();
    pushHistory(`Saved checkpoint (stage ${gameState.currentStage})`);
    runGeneration += 1;
  },

  clearCheckpoint() {
    gameState.checkpoint = null;
    savePersisted();
  },

  // Restore a saved mid-run checkpoint without resetting the run or clearing the
  // checkpoint itself (the Stage-map Resume Run control). Spawn the frozen
  // wave/boss so combat continues from the saved phase with the same Health,
  // Fury, and Pesos-earned-this-run.
  resumeFromCheckpoint() {
    const cp = gameState.checkpoint;
    if (!cp) return;
    runGeneration += 1;
    ensureHistoryBaseline();
    gameState.currentStage = cp.stageId;
    gameState.currentWave = cp.waveIndex;
    gameState.isBoss = cp.phase === 'boss';
    gameState.playerHealth = cp.fighterHealth;
    gameState.furyMeter = cp.furyMeter;
    gameState.runPesos = cp.pesosEarnedThisRun;
    gameState.combo = { chain: [], count: cp.comboCount, timer: 0, lastFiesta: false };
    gameState.paused = false;
    gameState.blocking = false;
    gameState.dodging = false;
    gameState.dodgeCooldown = 0;
    gameState.playerAttacking = '';
    gameState.playerHitFlash = false;
    gameState.feedbacks = [];
    gameState.screenFuryActive = false;
    gameState.fiestaFlash = false;
    gameState.showCombatHint = false;
    gameState.statusMessage = gameState.isBoss
      ? `Resumed boss duel: ${STAGES[cp.stageId - 1]?.bossName ?? 'boss'}`
      : `Resumed stage ${cp.stageId}, wave ${cp.waveIndex}`;
    gameState.enemies = [];
    if (gameState.isBoss) game.spawnBoss();
    else game.spawnWave();
    pushHistory(`Resumed checkpoint (stage ${cp.stageId})`);
    savePersisted();
  },

  pauseRun() {
    gameState.paused = true;
    gameState.blocking = false;
    gameState.statusMessage = 'Run paused — combat is frozen';
  },

  resumeRun() {
    gameState.paused = false;
    gameState.statusMessage = gameState.isBoss
      ? `Boss duel resumed: ${STAGES[gameState.currentStage - 1]?.bossName ?? 'boss'}`
      : `Wave ${gameState.currentWave} resumed`;
  },

  abandonRun() {
    runGeneration += 1;
    gameState.paused = false;
    gameState.blocking = false;
    gameState.dodging = false;
    gameState.playerAttacking = '';
    gameState.enemies = [];
    game.clearCheckpoint();
    gameState.statusMessage = 'Run abandoned — no victory rewards applied';
  },

  getMaxHealth,
  getAttack,
  getFuryGain,
  get speedMultiplier() {
    const mask = MASK_DEFS.find(
      (m) => gameState.ownedMasks.includes(m.id) && gameState.equippedMask === m.id && m.bonus === 'speed',
    );
    return mask?.bonusValue ?? 1;
  },
  get current() {
    return gameState;
  },
  get furyMax() {
    return 100;
  },
  get furyPct() {
    return gameState.furyMeter;
  },
  get furyReady() {
    return gameState.furyMeter >= 100;
  },
  get dodgeCooldownPct() {
    return Math.max(0, gameState.dodgeCooldown / 120);
  },
  get dodgeCooldownSeconds() {
    return Math.max(0, (gameState.dodgeCooldown / 120) * 2).toFixed(1);
  },
  get totalWaves() {
    return STAGES[gameState.currentStage - 1]?.waves ?? 3;
  },
  get theme(): StageTheme {
    return STAGES[gameState.currentStage - 1]?.theme ?? STAGES[0].theme;
  },
  get furyColor(): string {
    const mask = MASK_DEFS.find(
      (m) => gameState.ownedMasks.includes(m.id) && gameState.equippedMask === m.id,
    );
    return mask ? mask.furyColor : '#e63946';
  },
  get canUndo() {
    const cur = gameState.history[gameState.historyIndex];
    return !!cur && cur.parentId != null && gameState.history.some((h) => h.id === cur.parentId);
  },
  get canRedo() {
    const cur = gameState.history[gameState.historyIndex];
    return !!cur && cur.activeChildId != null && gameState.history.some((h) => h.id === cur.activeChildId);
  },

  // A snapshot belongs to an alternate branch when it shares a parent with
  // another snapshot that is *not* the snapshot immediately before it in the
  // list — i.e. it is a sibling path the player abandoned or revisited.
  isBranch(index: number): boolean {
    const entry = gameState.history[index];
    if (!entry || entry.parentId == null) return false;
    return gameState.history.filter((item) => item.parentId === entry.parentId).length > 1;
  },

  masks() {
    return MASK_DEFS.map((m) => ({
      ...m,
      unlocked: gameState.ownedMasks.includes(m.id),
      equipped: gameState.equippedMask === m.id,
    }));
  },

  getUpgradeCost(id: string): number {
    const u = UPGRADES.find((up) => up.id === id);
    if (!u) return 9999;
    const lvl = gameState.upgrades[id] ?? 0;
    return Math.floor(u.baseCost * u.costMultiplier ** lvl);
  },

  canUpgrade(id: string): boolean {
    const u = UPGRADES.find((up) => up.id === id);
    if (!u) return false;
    const lvl = gameState.upgrades[id] ?? 0;
    return lvl < u.maxLevel && gameState.pesos >= game.getUpgradeCost(id);
  },

  showToast(text: string, type: 'success' | 'info' | 'warn' = 'success') {
    gameState.toast = { id: ++toastId, text, type };
    gameState.statusMessage = text;
  },
  clearToast() {
    gameState.toast = null;
  },

  pushHistory,
  applyScenarioChange() {
    ensureHistoryBaseline();
    gameState.pesos += 25;
    gameState.pesosFlashId = ++pulseId;
    gameState.pesosChangeSeq += 1;
    savePersisted();
    pushHistory('Scenario: festival patron +25 Pesos');
    game.showToast('Scenario change applied: +25 Pesos', 'info');
  },

  undo() {
    const cur = gameState.history[gameState.historyIndex];
    if (!cur || cur.parentId == null) return false;
    const idx = gameState.history.findIndex((h) => h.id === cur.parentId);
    if (idx === -1) return false;
    const data = JSON.parse(gameState.history[idx].data);
    Object.assign(gameState, data);
    gameState.historyIndex = idx;
    gameState.playerHealth = getMaxHealth();
    savePersisted();
    return true;
  },

  redo() {
    const cur = gameState.history[gameState.historyIndex];
    if (!cur || cur.activeChildId == null) return false;
    const idx = gameState.history.findIndex((h) => h.id === cur.activeChildId);
    if (idx === -1) return false;
    const data = JSON.parse(gameState.history[idx].data);
    Object.assign(gameState, data);
    gameState.historyIndex = idx;
    gameState.playerHealth = getMaxHealth();
    savePersisted();
    return true;
  },

  restoreToIndex(index: number) {
    if (index < 0 || index >= gameState.history.length) return false;
    const data = JSON.parse(gameState.history[index].data);
    Object.assign(gameState, data);
    gameState.historyIndex = index;
    gameState.playerHealth = getMaxHealth();
    savePersisted();
    return true;
  },

  resetProgress() {
    runGeneration += 1;
    const d = defaultPersisted();
    Object.assign(gameState, d, {
      history: [],
      historyIndex: -1,
      playerHealth: 100,
      enemies: [],
      currentWave: 1,
      isBoss: false,
      furyMeter: 0,
      runPesos: 0,
      runMasks: [],
      combo: { chain: [], count: 0, timer: 0, lastFiesta: false },
      feedbacks: [],
      paused: false,
      toast: null,
      maskEquipToast: '',
      bossBanner: '',
      showMapHint: true,
      showCombatHint: false,
    });
    savePersisted();
    pushHistory('Progress reset');
  },

  startStage(stageId: number) {
    runGeneration += 1;
    ensureHistoryBaseline();
    gameState.currentStage = stageId;
    gameState.currentWave = 1;
    gameState.isBoss = false;
    gameState.playerHealth = getMaxHealth();
    gameState.furyMeter = 0;
    gameState.runPesos = 0;
    gameState.runMasks = [];
    gameState.dodgeCooldown = 0;
    gameState.combo = { chain: [], count: 0, timer: 0, lastFiesta: false };
    gameState.checkpoint = null;
    gameState.feedbacks = [];
    gameState.screenFuryActive = false;
    gameState.fiestaFlash = false;
    gameState.playerAttacking = '';
    gameState.playerHitFlash = false;
    gameState.blocking = false;
    gameState.dodging = false;
    gameState.enemies = [];
    gameState.paused = false;
    gameState.bossBanner = '';
    gameState.statusMessage = `Entering ${STAGES[stageId - 1]?.name ?? 'the arena'}`;
    gameState.showMapHint = false;
    gameState.showCombatHint = true;
    scheduleRun(9000, () => {
      gameState.showCombatHint = false;
    });
    game.spawnWave();
    savePersisted();
    pushHistory(`Start stage ${stageId}`);
  },

  spawnWave() {
    enemyId = 0;
    const stage = STAGES[gameState.currentStage - 1];
    if (!stage) return;
    const waveNum = gameState.currentWave;
    const banditCount = Math.min(2 + Math.floor(waveNum / 2), 5);
    const bruteCount = waveNum >= 2 ? Math.min(Math.floor((waveNum - 1) / 2), 2) : 0;
    const enemies: Enemy[] = [];
    for (let i = 0; i < banditCount; i++) {
      enemies.push(game.createEnemy('bandit', stage, 520 + i * 70));
    }
    for (let i = 0; i < bruteCount; i++) {
      enemies.push(game.createEnemy('brute', stage, 570 + (banditCount + i) * 70));
    }
    gameState.enemies = enemies;
    gameState.statusMessage = `Wave ${waveNum} of ${stage.waves}`;
    feedbackAdd(`Wave ${waveNum}`, 200, 150, 'combo');
  },

  spawnBoss() {
    enemyId = 0;
    const stage = STAGES[gameState.currentStage - 1];
    if (!stage) return;
    gameState.isBoss = true;
    gameState.enemies = [
      {
        id: ++enemyId,
        name: stage.bossName,
        health: stage.bossHealth,
        maxHealth: stage.bossHealth,
        attack: stage.bossAttack,
        speed: 0.8,
        type: 'boss',
        x: 520,
        attacking: false,
        telegraphing: false,
        dead: false,
        rewardPesos: stage.pesoReward,
        dropsMask: true,
        attackCooldown: 90,
        hitFlash: false,
      },
    ];
    gameState.bossBanner = `Boss Duel — ${stage.bossName}`;
    gameState.statusMessage = `Boss duel: ${stage.bossName}`;
    scheduleRun(2600, () => {
      gameState.bossBanner = '';
    });
  },

  createEnemy(type: 'bandit' | 'brute', stage: (typeof STAGES)[0], x: number): Enemy {
    const isBandit = type === 'bandit';
    return {
      id: ++enemyId,
      name: isBandit ? 'Bandit' : 'Brute',
      health: isBandit ? stage.banditHealth : stage.bruteHealth,
      maxHealth: isBandit ? stage.banditHealth : stage.bruteHealth,
      attack: isBandit ? stage.banditAttack : stage.bruteAttack,
      speed: isBandit ? 1.8 : 1.2,
      type,
      x,
      attacking: false,
      telegraphing: false,
      dead: false,
      rewardPesos: isBandit ? 10 + gameState.currentWave * 5 : 20 + gameState.currentWave * 8,
      dropsMask: false,
      attackCooldown: 30,
      hitFlash: false,
    };
  },

  lightAttack() {
    if (gameState.paused) return;
    if (gameState.playerAttacking !== '' || gameState.dodging) {
      gameState.statusMessage = 'Finish your current action first';
      return;
    }
    gameState.showCombatHint = false;
    gameState.playerAttacking = 'light';
    gameState.combo = {
      ...gameState.combo,
      chain: [...gameState.combo.chain, 'light'],
      timer: 180,
    };
    const alive = nearestEnemy();
    if (alive) {
      const dmg = Math.floor(getAttack() * 0.7);
      dealDamage(alive, dmg);
      gameState.furyMeter = Math.min(100, gameState.furyMeter + getFuryGain() * 0.5);
      gameState.combo = { ...gameState.combo, count: gameState.combo.count + 1 };
      feedbackAdd(`+${dmg}`, alive.x, 100, 'damage');
      feedbackAdd(`${gameState.combo.count}x`, 180, 80, 'combo');
      checkFiesta();
    } else {
      gameState.statusMessage = 'No bandit in range yet — let them close in';
    }
    scheduleRun(Math.round(300 / game.speedMultiplier), () => {
      if (gameState.playerAttacking === 'light') gameState.playerAttacking = '';
    });
  },

  heavyAttack() {
    if (gameState.paused) return;
    if (gameState.playerAttacking !== '' || gameState.dodging) {
      gameState.statusMessage = 'Finish your current action first';
      return;
    }
    gameState.showCombatHint = false;
    gameState.playerAttacking = 'heavy';
    gameState.combo = {
      ...gameState.combo,
      chain: [...gameState.combo.chain, 'heavy'],
      timer: 180,
    };
    const alive = nearestEnemy();
    if (alive) {
      const dmg = Math.floor(getAttack() * 1.5);
      dealDamage(alive, dmg);
      gameState.furyMeter = Math.min(100, gameState.furyMeter + getFuryGain());
      gameState.combo = { ...gameState.combo, count: gameState.combo.count + 1 };
      gameState.shakeId = ++pulseId;
      feedbackAdd(`+${dmg}`, alive.x, 100, 'damage');
      feedbackAdd(`${gameState.combo.count}x`, 180, 80, 'combo');
      checkFiesta();
    } else {
      gameState.statusMessage = 'No bandit in range yet — let them close in';
    }
    scheduleRun(Math.round(500 / game.speedMultiplier), () => {
      if (gameState.playerAttacking === 'heavy') gameState.playerAttacking = '';
    });
  },

  activateFury() {
    if (gameState.paused) return;
    if (gameState.furyMeter < 100) {
      gameState.furyDeniedId = ++pulseId;
      gameState.statusMessage = `Fiesta Fury is locked — land hits to fill the Fury meter (now ${Math.floor(gameState.furyMeter)} of 100)`;
      return;
    }
    if (gameState.playerAttacking !== '') return;
    gameState.playerAttacking = 'fury';
    gameState.furyMeter = 0;
    gameState.screenFuryActive = true;
    gameState.shakeId = ++pulseId;
    const furyDamage = Math.floor(getAttack() * 3);
    for (const e of gameState.enemies) {
      if (!e.dead) dealDamage(e, furyDamage);
    }
    feedbackAdd('💥 Fiesta Fury!', 300, 100, 'fiesta');
    scheduleRun(Math.round(1200 / game.speedMultiplier), () => {
      gameState.screenFuryActive = false;
      gameState.playerAttacking = '';
    });
  },

  startBlock() {
    if (gameState.paused) return;
    if (gameState.playerAttacking !== '' || gameState.dodging) return;
    gameState.blocking = true;
  },

  stopBlock() {
    gameState.blocking = false;
  },

  dodgeRoll() {
    if (gameState.paused) return;
    if (gameState.dodgeCooldown > 0) {
      gameState.statusMessage = `Dodge is recharging — wait ${game.dodgeCooldownSeconds}s for the cooldown to clear`;
      return;
    }
    if (gameState.dodging || gameState.playerAttacking !== '') return;
    gameState.dodging = true;
    gameState.dodgeCooldown = 120;
    scheduleRun(Math.round(400 / game.speedMultiplier), () => {
      gameState.dodging = false;
    });
  },

  tickEnemies() {
    gameState.enemies = gameState.enemies.map((enemy) => {
      if (enemy.dead) return enemy;
      let e = { ...enemy };
      if (e.x > 150) e = { ...e, x: e.x - e.speed * 3 };
      if (e.x <= 260 && !e.attacking && e.attackCooldown <= 0) {
        if (e.type === 'boss' && !e.telegraphing) {
          const enemyId = e.id;
          e = { ...e, telegraphing: true };
          scheduleRun(900, () => {
            gameState.enemies = gameState.enemies.map((en) =>
              en.id === enemyId ? { ...en, telegraphing: false, attacking: true } : en,
            );
            scheduleRun(200, () => {
              gameState.enemies = gameState.enemies.map((en) =>
                en.id === enemyId ? { ...en, attacking: false } : en,
              );
            });
            const striker = gameState.enemies.find((en) => en.id === enemyId);
            if (striker) enemyStrike(striker);
          });
        } else if (e.type !== 'boss') {
          const enemyId = e.id;
          e = { ...e, attacking: true };
          scheduleRun(250, () => {
            gameState.enemies = gameState.enemies.map((en) =>
              en.id === enemyId ? { ...en, attacking: false } : en,
            );
            const striker = gameState.enemies.find((en) => en.id === enemyId);
            if (striker) enemyStrike(striker);
          });
        }
        e = { ...e, attackCooldown: e.type === 'boss' ? 120 : 50 + Math.random() * 30 };
      }
      if (e.attackCooldown > 0) e = { ...e, attackCooldown: e.attackCooldown - 1 };
      return e;
    });
  },

  tickCombo() {
    if (gameState.combo.timer > 0) {
      gameState.combo = { ...gameState.combo, timer: gameState.combo.timer - 1 };
      if (gameState.combo.timer <= 0) {
        gameState.combo = { chain: [], count: 0, timer: 0, lastFiesta: false };
      }
    }
    if (gameState.dodgeCooldown > 0) {
      gameState.dodgeCooldown = Math.max(0, gameState.dodgeCooldown - game.speedMultiplier);
    }
  },

  buyUpgrade(id: string): boolean {
    if (!game.canUpgrade(id)) {
      gameState.statusMessage = `Need ${game.getUpgradeCost(id)} pesos to buy ${id}`;
      return false;
    }
    const cost = game.getUpgradeCost(id);
    ensureHistoryBaseline();
    gameState.pesos -= cost;
    gameState.pesosFlashId = ++pulseId;
    gameState.pesosChangeSeq += 1;
    gameState.upgrades = { ...gameState.upgrades, [id]: (gameState.upgrades[id] ?? 0) + 1 };
    gameState.levelFlashId = `${id}:${gameState.upgrades[id]}`;
    // Raise (never lower) the live capacity so the next run's HUD reflects it.
    gameState.playerHealth = Math.min(gameState.playerHealth, getMaxHealth());
    savePersisted();
    pushHistory(`Bought ${id} upgrade`);
    return true;
  },

  equipMask(maskId: string | null) {
    if (maskId !== null && !gameState.ownedMasks.includes(maskId)) return false;
    ensureHistoryBaseline();
    gameState.equippedMask = maskId;
    gameState.playerHealth = Math.min(gameState.playerHealth, getMaxHealth());
    if (maskId) {
      const mask = MASK_DEFS.find((m) => m.id === maskId);
      gameState.maskEquipToast = `${mask?.emoji ?? '🎭'} ${mask?.name ?? 'Mask'} equipped — ${mask?.bonus ?? ''} bonus active`;
      setTimeout(() => {
        gameState.maskEquipToast = '';
      }, 1800);
    } else {
      gameState.maskEquipToast = 'Mask unequipped';
      setTimeout(() => {
        gameState.maskEquipToast = '';
      }, 1400);
    }
    savePersisted();
    pushHistory(`Equipped mask: ${maskId ?? 'none'}`);
    return true;
  },

  saveToStorage() {
    savePersisted();
  },

  loadFromStorage() {
    const d = loadPersisted();
    Object.assign(gameState, d);
    gameState.playerHealth = getMaxHealth();
  },
};
