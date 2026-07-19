// FandangoFury — shared game state (Svelte 5 runes)

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

export const STAGES = [
  { id: 1, name: 'Plaza del Sol', waves: 3, bossName: 'El Bandido', bossHealth: 120, bossAttack: 12, banditHealth: 30, banditAttack: 5, bruteHealth: 60, bruteAttack: 8, pesoReward: 50, maskDrop: 'solar' },
  { id: 2, name: 'Mercado Nocturno', waves: 4, bossName: 'La Sombra', bossHealth: 200, bossAttack: 18, banditHealth: 45, banditAttack: 8, bruteHealth: 80, bruteAttack: 12, pesoReward: 80, maskDrop: 'luna' },
  { id: 3, name: 'Fortaleza Roja', waves: 5, bossName: 'El Rey Bandido', bossHealth: 350, bossAttack: 25, banditHealth: 60, banditAttack: 10, bruteHealth: 100, bruteAttack: 16, pesoReward: 120, maskDrop: 'fuego' },
];

export const MASK_DEFS = [
  { id: 'solar', name: 'Solar Mask', emoji: '☀️', bonus: 'damage' as const, bonusValue: 1.2, furyColor: '#e63946' },
  { id: 'luna', name: 'Luna Mask', emoji: '🌙', bonus: 'speed' as const, bonusValue: 1.3, furyColor: '#457b9d' },
  { id: 'fuego', name: 'Fuego Mask', emoji: '🔥', bonus: 'defense' as const, bonusValue: 1.25, furyColor: '#f4a261' },
];

export const UPGRADES = [
  { id: 'maxHealth', name: 'Max health', baseCost: 30, costMultiplier: 1.8, maxLevel: 10, effect: (lvl: number) => 100 + lvl * 20 },
  { id: 'attackPower', name: 'Attack power', baseCost: 40, costMultiplier: 1.8, maxLevel: 10, effect: (lvl: number) => 10 + lvl * 5 },
  { id: 'furyGain', name: 'Fury gain rate', baseCost: 35, costMultiplier: 1.8, maxLevel: 8, effect: (lvl: number) => 8 + lvl * 3 },
];

const STORAGE_KEY = 'fandangoFury';
let feedbackId = 0;
let enemyId = 0;
let historyIdSeq = 0;

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export interface GameState {
  pesos: number;
  currentStage: number;
  unlockedStages: number[];
  completedStages: number[];
  ownedMasks: string[];
  equippedMask: string | null;
  upgrades: Record<string, number>;
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
  statusMessage: string;
  maskEquipToast: string;
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
    statusMessage: '',
    maskEquipToast: '',
  };
}

function loadPersisted() {
  return safeGet(STORAGE_KEY, defaultPersisted());
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
  });
}

const persisted = loadPersisted();
export const gameState = $state<GameState>({
  ...defaultPersisted(),
  ...persisted,
  ...defaultRuntime(),
});

gameState.playerHealth = getMaxHealth();

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

function nearestEnemy(maxX = 720): Enemy | undefined {
  return gameState.enemies
    .filter((e) => !e.dead && e.x <= maxX)
    .sort((a, b) => a.x - b.x)[0];
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
    data: JSON.stringify({
      pesos: gameState.pesos,
      currentStage: gameState.currentStage,
      unlockedStages: [...gameState.unlockedStages],
      completedStages: [...gameState.completedStages],
      ownedMasks: [...gameState.ownedMasks],
      equippedMask: gameState.equippedMask,
      upgrades: { ...gameState.upgrades },
    }),
  };

  // Never discard the branch being diverged from — append the new node as a
  // child of the current node instead of truncating "future" entries. Both
  // the old (undone-from) branch and the new branch stay in `history` and
  // remain individually selectable via restoreToIndex.
  let history = [...gameState.history, snapshot];
  if (parentId !== null) {
    history = history.map((h) => (h.id === parentId ? { ...h, activeChildId: snapshot.id } : h));
  }
  if (history.length > 50) {
    history = history.slice(-50);
  }
  gameState.history = history;
  gameState.historyIndex = history.length - 1;
}

function feedbackAdd(text: string, x: number, y: number, type: CombatFeedback['type']) {
  const id = ++feedbackId;
  gameState.feedbacks = [
    ...gameState.feedbacks.filter((f) => Date.now() - f.timestamp < 1000),
    { id, text, x, y, type, timestamp: Date.now() },
  ];
  if (type === 'combo' || type === 'fiesta') {
    gameState.statusMessage = text;
  }
  setTimeout(() => {
    gameState.feedbacks = gameState.feedbacks.filter((f) => f.id !== id);
  }, 1000);
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
  } else {
    const stage = STAGES[gameState.currentStage - 1];
    if (stage && gameState.currentWave >= stage.waves) {
      pushHistory(`Waves cleared stage ${gameState.currentStage}`);
      game.spawnBoss();
    } else {
      gameState.currentWave += 1;
      pushHistory(`Wave ${gameState.currentWave - 1} cleared`);
      setTimeout(() => game.spawnWave(), 800);
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

  setTimeout(() => {
    gameState.enemies = gameState.enemies.map((e) =>
      e.id === enemy.id ? { ...e, hitFlash: false } : e,
    );
  }, 150);

  const target = gameState.enemies.find((e) => e.id === enemy.id);
  if (target?.dead) {
    gameState.pesos += target.rewardPesos;
    gameState.runPesos += target.rewardPesos;
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

    // Persist pesos/masks the instant they're earned, not only at wave-end,
    // so a mid-wave refresh never loses an already-earned reward.
    savePersisted();

    if (gameState.enemies.every((e) => e.dead)) {
      setTimeout(() => waveComplete(), 0);
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
      feedbackAdd('🎉 Fiesta Combo!', 200, 60, 'fiesta');
      const bonus = Math.floor(getAttack() * 2);
      for (const e of gameState.enemies) {
        if (!e.dead) dealDamage(e, bonus);
      }
      gameState.furyMeter = Math.min(100, gameState.furyMeter + getFuryGain() * 3);
      setTimeout(() => {
        gameState.fiestaFlash = false;
      }, 800);
    }
  }
}

function enemyStrike(enemy: Enemy) {
  if (gameState.dodging || enemy.dead) return;
  let dmg = enemy.attack;
  if (gameState.blocking) {
    dmg = Math.floor(dmg * 0.3);
    const mask = MASK_DEFS.find(
      (m) =>
        gameState.ownedMasks.includes(m.id) &&
        gameState.equippedMask === m.id &&
        m.bonus === 'defense',
    );
    if (mask) dmg = Math.floor(dmg / mask.bonusValue);
  }
  gameState.playerHealth = Math.max(0, gameState.playerHealth - dmg);
  gameState.playerHitFlash = true;
  feedbackAdd(`-${dmg}`, 100, 160, 'damage');
  setTimeout(() => {
    gameState.playerHitFlash = false;
  }, 200);
  if (gameState.playerHealth <= 0) pushHistory('Player defeated');
}

export const game = {
  getMaxHealth,
  getAttack,
  getFuryGain,
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
  get totalWaves() {
    return STAGES[gameState.currentStage - 1]?.waves ?? 3;
  },
  get canUndo() {
    const cur = gameState.history[gameState.historyIndex];
    return !!cur && cur.parentId != null && gameState.history.some((h) => h.id === cur.parentId);
  },
  get canRedo() {
    const cur = gameState.history[gameState.historyIndex];
    return !!cur && cur.activeChildId != null && gameState.history.some((h) => h.id === cur.activeChildId);
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

  pushHistory,
  applyScenarioChange() {
    pushHistory('Apply scenario change');
    gameState.statusMessage = 'Scenario change applied';
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
    const persistedDefaults = defaultPersisted();
    Object.assign(gameState, persistedDefaults, {
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
    });
    savePersisted();
    pushHistory('Progress reset');
  },

  startStage(stageId: number) {
    pushHistory(`Start stage ${stageId}`);
    gameState.currentStage = stageId;
    gameState.currentWave = 1;
    gameState.isBoss = false;
    gameState.playerHealth = getMaxHealth();
    gameState.furyMeter = 0;
    gameState.runPesos = 0;
    gameState.runMasks = [];
    gameState.dodgeCooldown = 0;
    gameState.combo = { chain: [], count: 0, timer: 0, lastFiesta: false };
    gameState.feedbacks = [];
    gameState.screenFuryActive = false;
    gameState.fiestaFlash = false;
    gameState.playerAttacking = '';
    gameState.playerHitFlash = false;
    gameState.blocking = false;
    gameState.dodging = false;
    gameState.enemies = [];
    gameState.statusMessage = '';
    game.spawnWave();
    savePersisted();
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
      enemies.push(game.createEnemy('bandit', stage, 420 + i * 70));
    }
    for (let i = 0; i < bruteCount; i++) {
      enemies.push(game.createEnemy('brute', stage, 470 + (banditCount + i) * 70));
    }
    gameState.enemies = enemies;
    gameState.statusMessage = `Wave ${waveNum} started`;
    feedbackAdd(`Wave ${waveNum}!`, 200, 150, 'combo');
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
        x: 420,
        attacking: false,
        telegraphing: false,
        dead: false,
        rewardPesos: stage.pesoReward,
        dropsMask: true,
        attackCooldown: 90,
        hitFlash: false,
      },
    ];
    gameState.statusMessage = `Boss duel: ${stage.bossName}`;
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
    if (gameState.playerAttacking !== '' || gameState.dodging) {
      gameState.statusMessage = 'Finish your current action first';
      return;
    }
    gameState.playerAttacking = 'light';
    gameState.combo = {
      ...gameState.combo,
      chain: [...gameState.combo.chain, 'light'],
      timer: 90,
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
      gameState.statusMessage = 'No enemy in range yet';
    }
    setTimeout(() => {
      if (gameState.playerAttacking === 'light') gameState.playerAttacking = '';
    }, 300);
  },

  heavyAttack() {
    if (gameState.playerAttacking !== '' || gameState.dodging) {
      gameState.statusMessage = 'Finish your current action first';
      return;
    }
    gameState.playerAttacking = 'heavy';
    gameState.combo = {
      ...gameState.combo,
      chain: [...gameState.combo.chain, 'heavy'],
      timer: 90,
    };
    const alive = nearestEnemy();
    if (alive) {
      const dmg = Math.floor(getAttack() * 1.5);
      dealDamage(alive, dmg);
      gameState.furyMeter = Math.min(100, gameState.furyMeter + getFuryGain());
      gameState.combo = { ...gameState.combo, count: gameState.combo.count + 1 };
      feedbackAdd(`+${dmg}`, alive.x, 100, 'damage');
      feedbackAdd(`${gameState.combo.count}x`, 180, 80, 'combo');
      checkFiesta();
    } else {
      gameState.statusMessage = 'No enemy in range yet';
    }
    setTimeout(() => {
      if (gameState.playerAttacking === 'heavy') gameState.playerAttacking = '';
    }, 500);
  },

  activateFury() {
    if (gameState.furyMeter < 100 || gameState.playerAttacking !== '') {
      gameState.statusMessage = 'Fury is not ready yet';
      return;
    }
    gameState.playerAttacking = 'fury';
    gameState.furyMeter = 0;
    gameState.screenFuryActive = true;
    const furyDamage = Math.floor(getAttack() * 3);
    for (const e of gameState.enemies) {
      if (!e.dead) dealDamage(e, furyDamage);
    }
    feedbackAdd('💥 Fiesta Fury!', 300, 100, 'fiesta');
    setTimeout(() => {
      gameState.screenFuryActive = false;
      gameState.playerAttacking = '';
    }, 1000);
  },

  startBlock() {
    if (gameState.playerAttacking !== '' || gameState.dodging) return;
    gameState.blocking = true;
  },

  stopBlock() {
    gameState.blocking = false;
  },

  dodgeRoll() {
    if (gameState.dodgeCooldown > 0) {
      gameState.statusMessage = 'Dodge is on cooldown';
      return;
    }
    if (gameState.dodging || gameState.playerAttacking !== '') return;
    gameState.dodging = true;
    gameState.dodgeCooldown = 120;
    setTimeout(() => {
      gameState.dodging = false;
    }, 400);
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
          setTimeout(() => {
            gameState.enemies = gameState.enemies.map((en) =>
              en.id === enemyId ? { ...en, telegraphing: false, attacking: true } : en,
            );
            setTimeout(() => {
              gameState.enemies = gameState.enemies.map((en) =>
                en.id === enemyId ? { ...en, attacking: false } : en,
              );
            }, 200);
            const striker = gameState.enemies.find((en) => en.id === enemyId);
            if (striker) enemyStrike(striker);
          }, 900);
        } else if (e.type !== 'boss') {
          const enemyId = e.id;
          e = { ...e, attacking: true };
          setTimeout(() => {
            gameState.enemies = gameState.enemies.map((en) =>
              en.id === enemyId ? { ...en, attacking: false } : en,
            );
            const striker = gameState.enemies.find((en) => en.id === enemyId);
            if (striker) enemyStrike(striker);
          }, 250);
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
      gameState.dodgeCooldown = Math.max(0, gameState.dodgeCooldown - 1);
    }
  },

  buyUpgrade(id: string): boolean {
    if (!game.canUpgrade(id)) {
      gameState.statusMessage = 'Cannot purchase that upgrade';
      return false;
    }
    const cost = game.getUpgradeCost(id);
    pushHistory(`Bought ${id} upgrade`);
    gameState.pesos -= cost;
    gameState.upgrades = { ...gameState.upgrades, [id]: (gameState.upgrades[id] ?? 0) + 1 };
    gameState.playerHealth = Math.min(gameState.playerHealth, getMaxHealth());
    savePersisted();
    return true;
  },

  equipMask(maskId: string | null) {
    pushHistory(`Equipped mask: ${maskId ?? 'none'}`);
    gameState.equippedMask = maskId;
    gameState.playerHealth = Math.min(gameState.playerHealth, getMaxHealth());
    if (maskId) {
      const mask = MASK_DEFS.find((m) => m.id === maskId);
      gameState.maskEquipToast = `${mask?.emoji ?? '🎭'} ${mask?.name ?? 'Mask'} equipped!`;
      setTimeout(() => {
        gameState.maskEquipToast = '';
      }, 1800);
    }
    savePersisted();
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

// NOTE: persistence is triggered by explicit savePersisted() calls at every
// mutation site above (startStage, dealDamage, waveComplete, buyUpgrade,
// equipMask, resetProgress, undo/redo/restoreToIndex). A top-level `$effect`
// must NOT be used here: `$effect` can only run inside a component's own
// effect root. Calling it at module scope throws `effect_orphan` the moment
// this module is evaluated during client hydration, which aborts the entire
// Svelte island's boot sequence and leaves every button in the app dead.
