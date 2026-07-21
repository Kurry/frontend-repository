import type {
  QuestState,
  RepSet,
  Zone,
  Waypoint,
  GearItem,
  Snapshot,
  HistoryBranch,
  GameMode,
  ChallengeRun,
  Difficulty,
  ChallengeCheckpoint,
  AccentId,
  Toast,
} from './types';

const STORAGE_KEY = 'repquest_state';
const HISTORY_KEY = 'repquest_history';
const ACCENT_KEY = 'repquest_accent';
const TIP_KEY = 'repquest_tip_seen';

function createDefaultZones(): Zone[] {
  return [
    {
      id: 'foothills',
      name: 'Foothills',
      startReps: 0,
      endReps: 100,
      bgColors: { sky: '#87CEEB', ground: '#4a7c3f', accent: '#6bae4a' },
    },
    {
      id: 'canyon',
      name: 'Canyon',
      startReps: 100,
      endReps: 300,
      bgColors: { sky: '#f4a460', ground: '#c2703e', accent: '#d4894a' },
    },
    {
      id: 'summit',
      name: 'Summit',
      startReps: 300,
      endReps: 600,
      bgColors: { sky: '#6a5acd', ground: '#4a4a6a', accent: '#8a7acd' },
    },
  ];
}

function createDefaultWaypoints(): Waypoint[] {
  return [
    { id: 1, repsRequired: 25, zoneId: 'foothills', isBoss: false, bossDefeated: false },
    { id: 2, repsRequired: 50, zoneId: 'foothills', isBoss: true, bossMinReps: 20, bossBonusQP: 10, bossDefeated: false },
    { id: 3, repsRequired: 75, zoneId: 'foothills', isBoss: false, bossDefeated: false },
    { id: 4, repsRequired: 100, zoneId: 'foothills', isBoss: false, bossDefeated: false },
    { id: 5, repsRequired: 130, zoneId: 'canyon', isBoss: false, bossDefeated: false },
    { id: 6, repsRequired: 160, zoneId: 'canyon', isBoss: false, bossDefeated: false },
    { id: 7, repsRequired: 200, zoneId: 'canyon', isBoss: true, bossMinReps: 30, bossBonusQP: 20, bossDefeated: false },
    { id: 8, repsRequired: 250, zoneId: 'canyon', isBoss: false, bossDefeated: false },
    { id: 9, repsRequired: 300, zoneId: 'canyon', isBoss: false, bossDefeated: false },
    { id: 10, repsRequired: 350, zoneId: 'summit', isBoss: false, bossDefeated: false },
    { id: 11, repsRequired: 400, zoneId: 'summit', isBoss: false, bossDefeated: false },
    { id: 12, repsRequired: 450, zoneId: 'summit', isBoss: true, bossMinReps: 40, bossBonusQP: 30, bossDefeated: false },
    { id: 13, repsRequired: 500, zoneId: 'summit', isBoss: false, bossDefeated: false },
    { id: 14, repsRequired: 600, zoneId: 'summit', isBoss: false, bossDefeated: false },
  ];
}

function createDefaultGear(): GearItem[] {
  return [
    { id: 'default', name: 'Default outfit', cost: 0, unlocked: true, equipped: true, color: '#4a90d9', bodyColor: '#4a90d9', hatColor: '#ffffff', description: 'Your starting gear' },
    { id: 'warrior', name: 'Warrior armor', cost: 15, unlocked: false, equipped: false, color: '#c0392b', bodyColor: '#c0392b', hatColor: '#e74c3c', description: 'Fierce red armor' },
    { id: 'ranger', name: 'Ranger cloak', cost: 25, unlocked: false, equipped: false, color: '#27ae60', bodyColor: '#27ae60', hatColor: '#2ecc71', description: 'Nature-inspired greens' },
    { id: 'royal', name: 'Royal robes', cost: 40, unlocked: false, equipped: false, color: '#8e44ad', bodyColor: '#8e44ad', hatColor: '#9b59b6', description: 'Noble purple robes' },
    { id: 'golden', name: 'Golden champion', cost: 60, unlocked: false, equipped: false, color: '#f39c12', bodyColor: '#f39c12', hatColor: '#f1c40f', description: 'Shining gold armor' },
    { id: 'shadow', name: 'Shadow ninja', cost: 80, unlocked: false, equipped: false, color: '#2c3e50', bodyColor: '#1a1a2e', hatColor: '#2c3e50', description: 'Dark and mysterious' },
  ];
}

function createDefaultState(): QuestState {
  return {
    lifetimeReps: 0,
    todayReps: 0,
    dailyGoal: 50,
    currentStreak: 0,
    questPoints: 0,
    repHistory: [],
    waypoints: createDefaultWaypoints(),
    zones: createDefaultZones(),
    unlockedZoneIds: ['foothills'],
    gear: createDefaultGear(),
    equippedGearId: 'default',
    dailyReminder: false,
    reminderHour: 18,
    lastGoalMetDate: '',
    zoneUnlockMessages: [],
    nextSetId: 1,
    challengeCheckpoint: null,
  };
}

function cloneState(state: QuestState): QuestState {
  return JSON.parse(JSON.stringify(state)) as QuestState;
}

function getLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const ls = window.localStorage;
    // Probe access — throws when storage is blocked / unavailable.
    ls.getItem('__repquest_probe__');
    return ls;
  } catch {
    return null;
  }
}

function loadState(): QuestState {
  const ls = safeLocalStorage();
  if (!ls) return createDefaultState();
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as QuestState;
    const defaults = createDefaultState();
    const merged = { ...defaults, ...parsed };
    merged.waypoints = parsed.waypoints?.length ? parsed.waypoints : defaults.waypoints;
    merged.zones = parsed.zones?.length ? parsed.zones : defaults.zones;
    merged.gear = parsed.gear?.length ? parsed.gear : defaults.gear;
    return merged;
  } catch {
    return createDefaultState();
  }
}

function saveState(state: QuestState): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or blocked — never crash */
  }
}

interface StoredHistory {
  branches: HistoryBranch[];
  activeBranchId: string;
}

function loadHistory(): StoredHistory {
  const ls = safeLocalStorage();
  const initial: StoredHistory = {
    branches: [{ id: 'main', label: 'Main', snapshots: [], currentIndex: 0 }],
    activeBranchId: 'main',
  };
  if (!ls) return initial;
  try {
    const raw = ls.getItem(HISTORY_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as StoredHistory;
    if (parsed.branches?.length) return parsed;
    return initial;
  } catch {
    return initial;
  }
}

function saveHistoryData(data: StoredHistory): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function loadAccent(): AccentId {
  const ls = safeLocalStorage();
  if (!ls) return 'amber';
  const v = ls.getItem(ACCENT_KEY);
  return v === 'teal' || v === 'rose' || v === 'amber' ? v : 'amber';
}

function initialTipSeen(): boolean {
  const ls = safeLocalStorage();
  return ls ? ls.getItem(TIP_KEY) === '1' : false;
}

export function getCurrentWaypointIndex(state: QuestState): number {
  let idx = -1;
  for (let i = 0; i < state.waypoints.length; i++) {
    if (state.lifetimeReps >= state.waypoints[i].repsRequired) {
      idx = i;
    } else {
      break;
    }
  }
  return idx;
}

export function getCurrentZone(state: QuestState): Zone {
  const wpIdx = getCurrentWaypointIndex(state);
  if (wpIdx >= 0) {
    const zoneId = state.waypoints[wpIdx].zoneId;
    return state.zones.find((z) => z.id === zoneId) || state.zones[0];
  }
  return state.zones[0];
}

export function getProgressToNextWaypoint(state: QuestState): { current: number; target: number; pct: number } {
  const wpIdx = getCurrentWaypointIndex(state);
  const prevReps = wpIdx >= 0 ? state.waypoints[wpIdx].repsRequired : 0;
  const nextIdx = wpIdx + 1;
  if (nextIdx >= state.waypoints.length) {
    return { current: state.lifetimeReps, target: state.lifetimeReps, pct: 100 };
  }
  const nextReps = state.waypoints[nextIdx].repsRequired;
  const pct = Math.min(100, ((state.lifetimeReps - prevReps) / (nextReps - prevReps)) * 100);
  return { current: state.lifetimeReps - prevReps, target: nextReps - prevReps, pct };
}

export function getTodayReps(state: QuestState): number {
  const today = getLocalDate();
  return state.repHistory.filter((s) => s.date === today).reduce((sum, s) => sum + s.reps, 0);
}

export function getWeeklyData(state: QuestState): { date: string; reps: number }[] {
  const result: { date: string; reps: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const reps = state.repHistory.filter((s) => s.date === dateStr).reduce((sum, s) => sum + s.reps, 0);
    result.push({ date: dateStr, reps });
  }
  return result;
}

// A short, dependency-free celebratory sting synthesized with the Web Audio
// API. Created lazily inside a user gesture (the click that resolves a run or
// defeats a boss), so browsers allow it. Fully guarded: any failure is silent.
let audioCtx: AudioContext | null = null;
export function playVictoryFanfare(): void {
  try {
    if (typeof window === 'undefined') return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 arpeggio
    notes.forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  } catch {
    /* audio unavailable — celebration is still shown visually */
  }
}

export class QuestStore {
  state = $state<QuestState>(loadState());
  branches = $state<HistoryBranch[]>(loadHistory().branches);
  activeBranchId = $state<string>(loadHistory().activeBranchId);
  gameMode = $state<GameMode>('quest');
  challengeRun = $state<ChallengeRun | null>(null);
  scenarioStep = $state<number>(0);
  feedbackMessage = $state<string>('');

  activeTab = $state<string>('quest');

  // Notification queue — multiple transient banners (e.g. a zone unlock firing
  // in the same tick as a boss defeat) are shown in order rather than the last
  // one clobbering the rest.
  toasts = $state<Toast[]>([]);
  ariaLive = $state<string>('');
  private toastSeq = 0;
  celebration = $state<boolean>(false);
  // Bumped on every successful rep log so the quest map can start a fresh,
  // time-based glide tween toward the new path position.
  glideToken = $state<number>(0);

  // Theme accent preference (optional personalization beyond the settings
  // payload). Persisted on its own key so it never muddles the quest state.
  accent = $state<AccentId>(loadAccent());
  firstRunTipDismissed = $state<boolean>(initialTipSeen());

  // Re-evaluated once per second so the challenge timer advances smoothly;
  // the same clock also keeps the daily reminder banner current.
  nowTick = $state<number>(Date.now());
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  get activeBranch(): HistoryBranch {
    return this.branches.find((b) => b.id === this.activeBranchId) || this.branches[0];
  }

  get history(): HistoryBranch {
    return this.activeBranch;
  }

  get todayReps(): number {
    return getTodayReps(this.state);
  }

  get currentWaypointIndex(): number {
    return getCurrentWaypointIndex(this.state);
  }

  get currentZone(): Zone {
    return getCurrentZone(this.state);
  }

  get progressToNext(): { current: number; target: number; pct: number } {
    return getProgressToNextWaypoint(this.state);
  }

  get goalProgress(): number {
    return this.state.dailyGoal > 0 ? Math.min(100, (this.todayReps / this.state.dailyGoal) * 100) : 0;
  }

  get goalColor(): string {
    const p = this.goalProgress;
    if (p >= 100) return '#22c55e';
    if (p >= 50) return '#f59e0b';
    return '#ef4444';
  }

  get canUndo(): boolean {
    return this.activeBranch.currentIndex > 0;
  }

  get canRedo(): boolean {
    const branch = this.activeBranch;
    return branch.currentIndex >= 0 && branch.currentIndex < branch.snapshots.length - 1;
  }

  get equippedGear(): GearItem {
    return this.state.gear.find((g) => g.id === this.state.equippedGearId) || this.state.gear[0];
  }

  get showReminderBanner(): boolean {
    // Read nowTick so Svelte re-runs this getter after each clock tick.
    const now = new Date(this.nowTick);
    if (!this.state.dailyReminder) return false;
    if (this.todayReps >= this.state.dailyGoal) return false;
    return now.getHours() >= this.state.reminderHour;
  }

  get historyStateLabel(): string {
    const branch = this.activeBranch;
    const snap = branch.snapshots[branch.currentIndex];
    return snap ? snap.action : 'Initial state';
  }

  get bestSingleSet(): number {
    return Math.max(0, ...this.state.repHistory.map((set) => set.reps));
  }

  get bestDayTotal(): number {
    const totals = new Map<string, number>();
    for (const set of this.state.repHistory) totals.set(set.date, (totals.get(set.date) || 0) + set.reps);
    return Math.max(0, ...totals.values());
  }

  get heatMapData(): { date: string; reps: number }[] {
    const totals = new Map<string, number>();
    for (const set of this.state.repHistory) totals.set(set.date, (totals.get(set.date) || 0) + set.reps);
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { date: key, reps: totals.get(key) || 0 };
    });
  }

  constructor() {
    this.state.todayReps = this.todayReps;
    this._checkStreak();
    this._ensureInitialSnapshot();
    this._applyAccent(this.accent);
    if (typeof window !== 'undefined') {
      this.tickTimer = setInterval(() => { this.nowTick = Date.now(); }, 1000);
    }
  }

  private _applyAccent(accent: AccentId): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.accent = accent;
  }

  setAccent(accent: AccentId): void {
    this.accent = accent;
    this._applyAccent(accent);
    const ls = safeLocalStorage();
    if (ls) { try { ls.setItem(ACCENT_KEY, accent); } catch { /* ignore */ } }
  }

  dismissFirstRunTip(): void {
    this.firstRunTipDismissed = true;
    const ls = safeLocalStorage();
    if (ls) { try { ls.setItem(TIP_KEY, '1'); } catch { /* ignore */ } }
  }

  private _ensureInitialSnapshot(): void {
    for (const branch of this.branches) {
      if (branch.snapshots.length === 0) {
        branch.snapshots.push({
          state: cloneState(this.state),
          action: 'Initial state',
          timestamp: Date.now(),
        });
        branch.currentIndex = 0;
      }
    }
  }

  private _checkStreak(): void {
    const today = getLocalDate();
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    if (this.state.lastGoalMetDate !== today) {
      if (this.state.lastGoalMetDate !== yesterday && this.state.currentStreak > 0) {
        this.state.currentStreak = 0;
      }
    }
  }

  private _restoreState(next: QuestState): void {
    Object.assign(this.state, cloneState(next));
    this.state.todayReps = this.todayReps;
  }

  private _save(): void {
    saveState(this.state);
  }

  private _saveHistory(): void {
    saveHistoryData({ branches: this.branches, activeBranchId: this.activeBranchId });
  }

  private _pushSnapshot(action: string): void {
    const branch = this.activeBranch;

    if (branch.currentIndex < branch.snapshots.length - 1) {
      const tail = branch.snapshots.slice(branch.currentIndex + 1);
      const altId = `branch-${Date.now()}`;
      this.branches.push({
        id: altId,
        label: `Branch ${this.branches.length}`,
        snapshots: [...branch.snapshots.slice(0, branch.currentIndex + 1).map((s) => ({ ...s, state: cloneState(s.state) })), ...tail.map((s) => ({ ...s, state: cloneState(s.state) }))],
        currentIndex: branch.snapshots.length - 1,
      });
      branch.snapshots = branch.snapshots.slice(0, branch.currentIndex + 1);
    }

    branch.snapshots.push({
      state: cloneState(this.state),
      action,
      timestamp: Date.now(),
    });
    branch.currentIndex = branch.snapshots.length - 1;

    if (branch.snapshots.length > 50) {
      branch.snapshots.shift();
      branch.currentIndex = Math.max(0, branch.currentIndex - 1);
    }

    this._saveHistory();
  }

  selectBranch(branchId: string): void {
    const branch = this.branches.find((b) => b.id === branchId);
    if (!branch) return;
    this.activeBranchId = branchId;
    const snap = branch.snapshots[branch.currentIndex];
    if (snap) {
      this._restoreState(snap.state);
      this._save();
    }
    this._saveHistory();
  }

  undo(): void {
    if (!this.canUndo) return;
    const branch = this.activeBranch;
    branch.currentIndex--;
    const snapshot = branch.snapshots[branch.currentIndex];
    this._restoreState(snapshot.state);
    this._save();
    this._saveHistory();
    this._toast('Undone: ' + snapshot.action, 'info');
  }

  redo(): void {
    if (!this.canRedo) return;
    const branch = this.activeBranch;
    branch.currentIndex++;
    const snapshot = branch.snapshots[branch.currentIndex];
    this._restoreState(snapshot.state);
    this._save();
    this._saveHistory();
    this._toast('Redone: ' + snapshot.action, 'info');
  }

  private _toast(message: string, tone: Toast['tone'] = 'info'): void {
    const id = ++this.toastSeq;
    this.toasts = [...this.toasts, { id, message, tone }];
    this.ariaLive = message;
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3200);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  announce(message: string): void { this._toast(message, 'info'); }

  private _celebrate(): void {
    this.celebration = false;
    requestAnimationFrame(() => {
      this.celebration = true;
      setTimeout(() => { this.celebration = false; }, 1300);
    });
    playVictoryFanfare();
  }

  setGameMode(mode: GameMode): void {
    if (this.gameMode === mode) return;
    this.gameMode = mode;
    if (mode === 'challenge') {
      this.challengeRun ??= this._idleChallenge('Normal');
    }
    this.feedbackMessage = mode === 'quest' ? 'Quest mode active' : 'Challenge mode ready — start a run';
  }

  private _challengeBoss() {
    return this.state.waypoints.find((wp) => wp.isBoss && !wp.bossDefeated)
      || this.state.waypoints.find((wp) => wp.isBoss)!;
  }

  private _targetFor(difficulty: Difficulty): number {
    const base = this._challengeBoss()?.bossMinReps || 20;
    return difficulty === 'Easy' ? Math.max(1, base - 5) : difficulty === 'Hard' ? base + 10 : base;
  }

  private _idleChallenge(difficulty: Difficulty): ChallengeRun {
    const boss = this._challengeBoss();
    return { status: 'idle', bossWaypointId: boss?.id || 2, difficulty, repsLogged: 0, targetReps: this._targetFor(difficulty), startedAt: 0, pausedElapsed: 0, result: null };
  }

  setChallengeDifficulty(difficulty: Difficulty): void {
    if (this.challengeRun && ['active', 'paused'].includes(this.challengeRun.status)) {
      this.feedbackMessage = 'End the current run before changing difficulty';
      return;
    }
    this.challengeRun = this._idleChallenge(difficulty);
    this.feedbackMessage = `${difficulty} difficulty selected — target ${this.challengeRun.targetReps} reps`;
  }

  startChallengeRun(): void {
    if (this.gameMode !== 'challenge') return;
    const boss = this.state.waypoints.find((wp) => wp.isBoss && !wp.bossDefeated);
    if (!boss) {
      this.feedbackMessage = 'No undefeated bosses available';
      this._toast('No undefeated bosses available', 'warn');
      return;
    }
    const difficulty = this.challengeRun?.difficulty || 'Normal';
    this.challengeRun = {
      status: 'active',
      bossWaypointId: boss.id,
      difficulty,
      repsLogged: 0,
      targetReps: this._targetFor(difficulty),
      startedAt: Date.now(),
      pausedElapsed: 0,
      result: null,
    };
    this.feedbackMessage = `Run started — need ${this.challengeRun.targetReps} reps this run`;
    this._toast(this.feedbackMessage, 'info');
  }

  pauseChallengeRun(): void {
    if (this.challengeRun?.status === 'active') {
      const elapsed = Date.now() - this.challengeRun.startedAt;
      this.challengeRun = { ...this.challengeRun, status: 'paused', pausedElapsed: this.challengeRun.pausedElapsed + elapsed, startedAt: 0 };
      this.feedbackMessage = 'Run paused';
      this._toast('Run paused', 'info');
    }
  }

  resumeChallengeRun(): void {
    if (this.challengeRun?.status === 'paused') {
      this.challengeRun = { ...this.challengeRun, status: 'active', startedAt: Date.now() };
      this.feedbackMessage = 'Run resumed';
      this._toast('Run resumed', 'info');
    }
  }

  endChallengeRun(): void {
    if (!this.challengeRun || !['active', 'paused'].includes(this.challengeRun.status)) return;
    const result = this.challengeRun.repsLogged >= this.challengeRun.targetReps ? 'Victory' : 'Defeat';
    this.challengeRun = { ...this.challengeRun, status: 'ended', result };
    const shortfall = Math.max(0, this.challengeRun.targetReps - this.challengeRun.repsLogged);
    this.feedbackMessage = result === 'Victory'
      ? `Victory: ${this.challengeRun.repsLogged} / ${this.challengeRun.targetReps} reps`
      : `Defeat: ${this.challengeRun.repsLogged} / ${this.challengeRun.targetReps} reps — short by ${shortfall}`;
    this._toast(this.feedbackMessage, result === 'Victory' ? 'victory' : 'defeat');
    if (result === 'Victory') this._celebrate();
  }

  restartChallengeRun(): void {
    this.challengeRun = this._idleChallenge(this.challengeRun?.difficulty || 'Normal');
    this.feedbackMessage = 'Ready for a new challenge run';
  }

  logChallengeReps(reps: number): void {
    if (!this.challengeRun || this.challengeRun.status !== 'active') {
      const msg = 'Start an active run before logging challenge reps';
      this.feedbackMessage = msg;
      this._toast(msg, 'warn');
      return;
    }
    if (!Number.isInteger(reps) || reps <= 0) {
      this.feedbackMessage = 'Reps must be a positive whole number';
      return;
    }

    this.challengeRun = { ...this.challengeRun, repsLogged: this.challengeRun.repsLogged + reps };
    if (this.challengeRun.repsLogged >= this.challengeRun.targetReps) {
      this.challengeRun = { ...this.challengeRun, status: 'ended', result: 'Victory' };
      this.feedbackMessage = `Victory: ${this.challengeRun.repsLogged} / ${this.challengeRun.targetReps} reps`;
      this._toast(this.feedbackMessage, 'victory');
      this._celebrate();
    } else this.feedbackMessage = `Run progress: ${this.challengeRun.repsLogged} / ${this.challengeRun.targetReps} reps`;
  }

  saveChallengeProgress(): void {
    const run = this.challengeRun;
    if (!run || !['active', 'paused'].includes(run.status) || run.repsLogged < 1) {
      this._toast('Log at least one rep in an active or paused run to save', 'warn');
      return;
    }
    const elapsedMs = run.pausedElapsed + (run.status === 'active' ? Math.max(0, Date.now() - run.startedAt) : 0);
    this.state.challengeCheckpoint = {
      runStatus: run.status as 'active' | 'paused', bossWaypointId: run.bossWaypointId,
      difficulty: run.difficulty, repsLogged: run.repsLogged, targetReps: run.targetReps,
      elapsedMs,
      savedAt: new Date().toISOString(),
    };
    this._save();
    this._toast('Saved challenge progress', 'success');
  }

  resumeSavedRun(): void {
    const cp = this.state.challengeCheckpoint;
    if (!cp) {
      this._toast('No saved run to resume', 'warn');
      return;
    }
    this.gameMode = 'challenge';
    this.challengeRun = {
      status: cp.runStatus,
      bossWaypointId: cp.bossWaypointId,
      difficulty: cp.difficulty,
      repsLogged: cp.repsLogged,
      targetReps: cp.targetReps,
      startedAt: cp.runStatus === 'active' ? Date.now() : 0,
      pausedElapsed: Math.max(0, cp.elapsedMs ?? 0),
      result: null,
    };
    this.feedbackMessage = `Restored ${cp.difficulty} run: ${cp.repsLogged} / ${cp.targetReps} reps`;
    this._toast(this.feedbackMessage, 'info');
  }

  applyScenarioChange(): void {
    this.scenarioStep = (this.scenarioStep + 1) % 3;
    const scenarios = [
      { label: 'Scenario A: boost daily goal', apply: () => { this.state.dailyGoal += 5; } },
      { label: 'Scenario B: grant bonus QP', apply: () => { this.state.questPoints += 10; } },
      { label: 'Scenario C: extend streak display', apply: () => { this.state.currentStreak = Math.max(this.state.currentStreak, 1); } },
    ];
    const scenario = scenarios[this.scenarioStep];
    scenario.apply();
    this._pushSnapshot(scenario.label);
    this._save();
    this._toast(scenario.label, 'info');
  }

  logReps(reps: number, note = ''): void {
    if (this.gameMode === 'challenge') {
      this.feedbackMessage = 'Switch to quest mode to log adventure reps';
      return;
    }

    if (!Number.isInteger(reps) || reps < 1 || reps > 9999 || note.length > 120) {
      this.feedbackMessage = 'Reps must be a whole number from 1 through 9999 and note must be at most 120 characters';
      return;
    }

    const prevLifetime = this.state.lifetimeReps;
    const newLifetime = prevLifetime + reps;
    const prevWpIdx = getCurrentWaypointIndex(this.state);

    const today = getLocalDate();
    const setId = `set-${this.state.nextSetId}`;
    const loggedAt = new Date().toISOString();
    const set: RepSet = {
      id: setId,
      setId,
      reps,
      ...(note.trim() ? { note: note.trim() } : {}),
      timestamp: Date.now(),
      loggedAt,
      date: today,
    };
    this.state.nextSetId++;
    this.state.repHistory.unshift(set);

    for (const wp of this.state.waypoints) {
      if (wp.isBoss && !wp.bossDefeated && newLifetime >= wp.repsRequired && prevLifetime >= wp.repsRequired) {
        if (reps >= (wp.bossMinReps || 0)) {
          wp.bossDefeated = true;
          const bonus = wp.bossBonusQP || 0;
          this.state.questPoints += bonus;
          this._toast(`Boss defeated! +${bonus} quest points`, 'victory');
          this._celebrate();
        }
      }
    }

    this.state.lifetimeReps = newLifetime;
    this.state.questPoints += reps;
    this.glideToken++;

    const newWpIdx = getCurrentWaypointIndex(this.state);
    for (let i = Math.max(0, prevWpIdx + 1); i <= newWpIdx; i++) {
      const wp = this.state.waypoints[i];
      const zone = this.state.zones.find((z) => z.id === wp.zoneId);
      if (zone && !this.state.unlockedZoneIds.includes(zone.id)) {
        this.state.unlockedZoneIds.push(zone.id);
        if (!this.state.zoneUnlockMessages.includes(zone.id)) {
          this.state.zoneUnlockMessages.push(zone.id);
          this._toast(`Zone unlocked: ${zone.name}`, 'success');
        }
      }
    }

    const todayTotal = getTodayReps(this.state);
    if (todayTotal >= this.state.dailyGoal && this.state.lastGoalMetDate !== today) {
      const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      if (this.state.lastGoalMetDate === yesterday || this.state.lastGoalMetDate === '') {
        this.state.currentStreak++;
      } else if (this.state.lastGoalMetDate !== today) {
        this.state.currentStreak = 1;
      }
      this.state.lastGoalMetDate = today;
    }

    this._pushSnapshot(`Logged ${reps} reps`);
    this._save();
    this._toast(`Logged ${reps} reps`, 'success');
  }

  private _spentGearPoints(): number {
    return this.state.gear.filter((g) => g.unlocked && g.cost > 0).reduce((sum, g) => sum + g.cost, 0);
  }

  deleteSet(setId: string): void {
    const set = this.state.repHistory.find((s) => s.id === setId);
    if (!set) return;

    this.state.repHistory = this.state.repHistory.filter((s) => s.id !== setId);
    this.state.lifetimeReps = Math.max(0, this.state.repHistory.reduce((sum, s) => sum + s.reps, 0));

    const wpIdx = getCurrentWaypointIndex(this.state);
    const unlocked = new Set<string>(['foothills']);
    for (let i = 0; i <= wpIdx; i++) {
      const zoneId = this.state.waypoints[i].zoneId;
      unlocked.add(zoneId);
    }
    this.state.unlockedZoneIds = [...unlocked];

    this._recalculateBossesAndQP();
    this._recalculateStreak();
    this.glideToken++;

    this._pushSnapshot('Deleted set');
    this._save();
    this._toast('Set deleted', 'info');
  }

  private _recalculateBossesAndQP(): void {
    const sorted = [...this.state.repHistory].sort((a, b) => a.timestamp - b.timestamp);
    let cumulativeReps = 0;
    let bossQp = 0;

    for (const wp of this.state.waypoints) {
      wp.bossDefeated = false;
    }

    for (const repSet of sorted) {
      const prevCumulative = cumulativeReps;
      cumulativeReps += repSet.reps;
      for (const wp of this.state.waypoints) {
        if (wp.isBoss && !wp.bossDefeated && cumulativeReps >= wp.repsRequired && prevCumulative >= wp.repsRequired) {
          if (repSet.reps >= (wp.bossMinReps || 0)) {
            wp.bossDefeated = true;
            bossQp += wp.bossBonusQP || 0;
          }
        }
      }
    }

    const baseQp = this.state.repHistory.reduce((sum, s) => sum + s.reps, 0);
    this.state.questPoints = baseQp + bossQp - this._spentGearPoints();
  }

  private _recalculateStreak(): void {
    const dateReps = new Map<string, number>();
    for (const set of this.state.repHistory) {
      dateReps.set(set.date, (dateReps.get(set.date) || 0) + set.reps);
    }

    let streak = 0;
    const today = getLocalDate();

    if ((dateReps.get(today) || 0) >= this.state.dailyGoal) {
      streak = 1;
    }

    const checkD = new Date(today);
    checkD.setDate(checkD.getDate() - 1);
    while (true) {
      const ds = `${checkD.getFullYear()}-${String(checkD.getMonth() + 1).padStart(2, '0')}-${String(checkD.getDate()).padStart(2, '0')}`;
      if ((dateReps.get(ds) || 0) >= this.state.dailyGoal) {
        streak++;
        checkD.setDate(checkD.getDate() - 1);
      } else {
        break;
      }
    }

    this.state.currentStreak = streak;
    this.state.lastGoalMetDate = (dateReps.get(today) || 0) >= this.state.dailyGoal ? today : '';
  }

  buyGear(gearId: string): void {
    const gear = this.state.gear.find((g) => g.id === gearId);
    if (!gear || gear.unlocked) return;
    if (this.state.questPoints < gear.cost) {
      this.feedbackMessage = 'Not enough quest points';
      this._toast('Not enough quest points', 'warn');
      return;
    }

    gear.unlocked = true;
    this.state.questPoints -= gear.cost;
    this._pushSnapshot(`Bought ${gear.name}`);
    this._save();
    this._toast(`Unlocked: ${gear.name}`, 'success');
  }

  equipGear(gearId: string): void {
    const gear = this.state.gear.find((g) => g.id === gearId);
    if (!gear || !gear.unlocked) return;

    for (const g of this.state.gear) {
      g.equipped = false;
    }
    gear.equipped = true;
    this.state.equippedGearId = gearId;
    this._pushSnapshot(`Equipped ${gear.name}`);
    this._save();
    this._toast(`Equipped: ${gear.name}`, 'info');
  }

  updateDailyGoal(goal: number): void {
    if (!Number.isInteger(goal) || goal < 1 || goal > 9999) return;
    this.state.dailyGoal = goal;
    this._pushSnapshot('Updated daily goal');
    this._save();
  }

  toggleDailyReminder(): void {
    this.state.dailyReminder = !this.state.dailyReminder;
    this._save();
  }

  updateReminderHour(hour: number): void {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;
    this.state.reminderHour = hour;
    this._save();
  }

  saveSettings(dailyGoal: number, reminderEnabled: boolean, reminderHour: number): void {
    if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 9999 || !Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) return;
    this.state.dailyGoal = dailyGoal;
    this.state.dailyReminder = reminderEnabled;
    this.state.reminderHour = reminderHour;
    this._recalculateStreak();
    this._pushSnapshot('Updated settings');
    this._save();
    this._toast('Settings saved', 'success');
  }

  exportQuestLog() {
    return {
      schemaVersion: '1.0', exportedAt: new Date().toISOString(), dailyGoal: this.state.dailyGoal,
      streak: this.state.currentStreak, lifetimeReps: this.state.lifetimeReps, questPoints: this.state.questPoints,
      unlockedZones: this.state.unlockedZoneIds.map((id) => this.state.zones.find((z) => z.id === id)?.name).filter(Boolean),
      unlockedGearIds: this.state.gear.filter((g) => g.unlocked).map((g) => g.id), equippedGearId: this.state.equippedGearId,
      defeatedBossIds: this.state.waypoints.filter((w) => w.isBoss && w.bossDefeated).map((w) => w.id),
      // Optional round-trip fields so reminder settings survive export/import
      // coherently with the rest of the state (never silently reverting).
      reminderEnabled: this.state.dailyReminder,
      reminderHour: this.state.reminderHour,
      sets: this.state.repHistory.map(({ setId, id, reps, loggedAt, timestamp, note }) => ({
        setId: setId || id,
        reps,
        loggedAt: loggedAt || new Date(timestamp).toISOString(),
        ...(note ? { note } : {}),
      })),
    };
  }

  exportCsv(): string {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const chronological = [...this.state.repHistory].sort((a, b) => a.timestamp - b.timestamp);
    const rows = ['date,reps,note', ...chronological.map((set) => [set.loggedAt || new Date(set.timestamp).toISOString(), set.reps, set.note || ''].map(escape).join(','))];
    return rows.join('\n');
  }

  importQuestLog(value: unknown): boolean {
    try {
      if (!value || typeof value !== 'object') return false;
      const doc = value as Record<string, unknown>;
      const requiredNumbers = ['dailyGoal', 'streak', 'lifetimeReps', 'questPoints'];
      if (typeof doc.schemaVersion !== 'string' || !Array.isArray(doc.sets)
        || typeof doc.exportedAt !== 'string' || !Number.isFinite(Date.parse(doc.exportedAt))
        || !requiredNumbers.every((key) => Number.isInteger(doc[key]))
        || (doc.dailyGoal as number) < 1 || (doc.dailyGoal as number) > 9999
        || (doc.streak as number) < 0 || (doc.lifetimeReps as number) < 0 || (doc.questPoints as number) < 0
        || !Array.isArray(doc.unlockedZones) || !Array.isArray(doc.unlockedGearIds)
        || typeof doc.equippedGearId !== 'string' || !Array.isArray(doc.defeatedBossIds)) return false;
      const defaults = createDefaultState();
      const knownZoneNames = new Set(defaults.zones.map((zone) => zone.name));
      const knownGearIds = new Set(defaults.gear.map((gear) => gear.id));
      const knownBossIds = new Set(defaults.waypoints.filter((waypoint) => waypoint.isBoss).map((waypoint) => String(waypoint.id)));
      if (!(doc.unlockedZones as unknown[]).every((name) => typeof name === 'string' && knownZoneNames.has(name))
        || !(doc.unlockedGearIds as unknown[]).every((id) => typeof id === 'string' && knownGearIds.has(id))
        || !(doc.defeatedBossIds as unknown[]).every((id) => (typeof id === 'string' || typeof id === 'number') && knownBossIds.has(String(id)))
        || (doc.reminderEnabled != null && typeof doc.reminderEnabled !== 'boolean')
        || (doc.reminderHour != null && (!Number.isInteger(doc.reminderHour) || (doc.reminderHour as number) < 0 || (doc.reminderHour as number) > 23))) return false;
      const sets: RepSet[] = doc.sets.map((raw) => {
        if (!raw || typeof raw !== 'object') throw new Error('invalid set');
        const item = raw as Record<string, unknown>;
        if (!Number.isInteger(item.reps) || (item.reps as number) < 1 || (item.reps as number) > 9999 || typeof item.setId !== 'string' || item.setId.length === 0 || typeof item.loggedAt !== 'string' || (item.note != null && (typeof item.note !== 'string' || item.note.length > 120))) throw new Error('invalid set');
        const timestamp = Date.parse(item.loggedAt);
        if (!Number.isFinite(timestamp)) throw new Error('invalid timestamp');
        const date = new Date(timestamp); const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        return { id: item.setId, setId: item.setId, reps: item.reps as number, note: item.note as string | undefined, loggedAt: item.loggedAt, timestamp, date: dateKey };
      });
      if (new Set(sets.map((set) => set.setId)).size !== sets.length) return false;
      if (sets.reduce((sum, set) => sum + set.reps, 0) !== doc.lifetimeReps) return false;
      const unlockedNames = new Set((doc.unlockedZones as unknown[]).map(String));
      const unlockedGear = new Set((doc.unlockedGearIds as unknown[]).map(String));
      const defeated = new Set((doc.defeatedBossIds as unknown[]).map(String));
      defaults.gear.forEach((gear) => { gear.unlocked = unlockedGear.has(gear.id); gear.equipped = gear.id === doc.equippedGearId; });
      if (!defaults.gear.some((gear) => gear.id === doc.equippedGearId && gear.unlocked)) return false;
      defaults.waypoints.forEach((waypoint) => { waypoint.bossDefeated = defeated.has(String(waypoint.id)); });
      const unlockedZoneIds = defaults.zones.filter((zone) => unlockedNames.has(zone.name)).map((zone) => zone.id);
      if (!unlockedZoneIds.includes('foothills')) unlockedZoneIds.unshift('foothills');
      const nextSetId = sets.reduce((highest, set) => {
        const match = /^set-(\d+)$/.exec(set.setId);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0) + 1;
      // Restore optional reminder settings when present so the round trip is
      // coherent across every facet.
      const reminderEnabled = typeof doc.reminderEnabled === 'boolean' ? doc.reminderEnabled : defaults.dailyReminder;
      const reminderHour = Number.isInteger(doc.reminderHour) && (doc.reminderHour as number) >= 0 && (doc.reminderHour as number) <= 23 ? (doc.reminderHour as number) : defaults.reminderHour;
      this._restoreState({ ...defaults, dailyGoal: doc.dailyGoal as number, currentStreak: doc.streak as number,
        questPoints: doc.questPoints as number, repHistory: sets, lifetimeReps: doc.lifetimeReps as number,
        unlockedZoneIds, equippedGearId: doc.equippedGearId as string, nextSetId,
        dailyReminder: reminderEnabled, reminderHour });
      this.gameMode = 'quest';
      this.challengeRun = null;
      this.glideToken++;
      this._pushSnapshot('Imported quest log'); this._save(); this._toast('Quest Log imported', 'success');
      return true;
    } catch { return false; }
  }

  resetQuest(): void {
    const defaults = createDefaultState();
    this._restoreState(defaults);
    this.branches = [{ id: 'main', label: 'Main', snapshots: [], currentIndex: 0 }];
    this.activeBranchId = 'main';
    this.gameMode = 'quest';
    this.challengeRun = null;
    this.scenarioStep = 0;
    this.glideToken++;
    this._ensureInitialSnapshot();
    this._save();
    this._saveHistory();
    this._toast('Quest reset — starting fresh', 'info');
  }
}

export const quest = new QuestStore();
