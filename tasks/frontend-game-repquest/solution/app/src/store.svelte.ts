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
} from './types';

const STORAGE_KEY = 'repquest_state';
const HISTORY_KEY = 'repquest_history';

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
    { id: 'default', name: 'Default Outfit', cost: 0, unlocked: true, equipped: true, color: '#4a90d9', bodyColor: '#4a90d9', hatColor: '#ffffff', description: 'Your starting gear' },
    { id: 'warrior', name: 'Warrior Armor', cost: 15, unlocked: false, equipped: false, color: '#c0392b', bodyColor: '#c0392b', hatColor: '#e74c3c', description: 'Fierce red armor' },
    { id: 'ranger', name: 'Ranger Cloak', cost: 25, unlocked: false, equipped: false, color: '#27ae60', bodyColor: '#27ae60', hatColor: '#2ecc71', description: 'Nature-inspired greens' },
    { id: 'royal', name: 'Royal Robes', cost: 40, unlocked: false, equipped: false, color: '#8e44ad', bodyColor: '#8e44ad', hatColor: '#9b59b6', description: 'Noble purple robes' },
    { id: 'golden', name: 'Golden Champion', cost: 60, unlocked: false, equipped: false, color: '#f39c12', bodyColor: '#f39c12', hatColor: '#f1c40f', description: 'Shining gold armor' },
    { id: 'shadow', name: 'Shadow Ninja', cost: 80, unlocked: false, equipped: false, color: '#2c3e50', bodyColor: '#1a1a2e', hatColor: '#2c3e50', description: 'Dark and mysterious' },
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
    return typeof window !== 'undefined' ? window.localStorage : null;
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
    /* quota exceeded */
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

export class QuestStore {
  state = $state<QuestState>(loadState());
  branches = $state<HistoryBranch[]>(loadHistory().branches);
  activeBranchId = $state<string>(loadHistory().activeBranchId);
  gameMode = $state<GameMode>('quest');
  challengeRun = $state<ChallengeRun | null>(null);
  scenarioStep = $state<number>(0);
  feedbackMessage = $state<string>('');

  activeTab = $state<string>('quest');
  notificationMessage = $state<string>('');
  showNotification = $state<boolean>(false);

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
    if (!this.state.dailyReminder) return false;
    if (this.todayReps >= this.state.dailyGoal) return false;
    const now = new Date();
    return now.getHours() >= this.state.reminderHour;
  }

  get historyStateLabel(): string {
    const branch = this.activeBranch;
    const snap = branch.snapshots[branch.currentIndex];
    return snap ? snap.action : 'Initial state';
  }

  constructor() {
    this.state.todayReps = this.todayReps;
    this._checkStreak();
    this._ensureInitialSnapshot();
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
    this._notify('Undone: ' + snapshot.action);
  }

  redo(): void {
    if (!this.canRedo) return;
    const branch = this.activeBranch;
    branch.currentIndex++;
    const snapshot = branch.snapshots[branch.currentIndex];
    this._restoreState(snapshot.state);
    this._save();
    this._saveHistory();
    this._notify('Redone: ' + snapshot.action);
  }

  private _notify(msg: string): void {
    this.notificationMessage = msg;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 2500);
  }

  setGameMode(mode: GameMode): void {
    if (this.gameMode === mode) return;
    this.gameMode = mode;
    if (mode === 'challenge') {
      this.challengeRun = { status: 'idle', bossWaypointId: 0, repsLogged: 0, startedAt: 0 };
    } else {
      this.challengeRun = null;
    }
    this.feedbackMessage = mode === 'quest' ? 'Quest mode active' : 'Challenge mode ready — start a run';
  }

  startChallengeRun(): void {
    if (this.gameMode !== 'challenge') return;
    const boss = this.state.waypoints.find((wp) => wp.isBoss && !wp.bossDefeated);
    if (!boss) {
      this.feedbackMessage = 'No undefeated bosses available';
      return;
    }
    this.challengeRun = {
      status: 'active',
      bossWaypointId: boss.id,
      repsLogged: 0,
      startedAt: Date.now(),
    };
    this.feedbackMessage = `Boss challenge run started — target waypoint ${boss.id}, need ${boss.bossMinReps}+ reps in one set`;
  }

  pauseChallengeRun(): void {
    if (this.challengeRun?.status === 'active') {
      this.challengeRun = { ...this.challengeRun, status: 'paused' };
      this.feedbackMessage = 'Challenge paused';
    }
  }

  resumeChallengeRun(): void {
    if (this.challengeRun?.status === 'paused') {
      this.challengeRun = { ...this.challengeRun, status: 'active' };
      this.feedbackMessage = 'Challenge resumed';
    }
  }

  endChallengeRun(): void {
    if (!this.challengeRun || this.challengeRun.status === 'idle') return;
    this.challengeRun = { ...this.challengeRun, status: 'failed' };
    this.feedbackMessage = 'Challenge run ended';
  }

  restartChallengeRun(): void {
    this.challengeRun = { status: 'idle', bossWaypointId: 0, repsLogged: 0, startedAt: 0 };
    this.feedbackMessage = 'Ready for a new challenge run';
  }

  logChallengeReps(reps: number): void {
    if (!this.challengeRun || this.challengeRun.status !== 'active') {
      this.feedbackMessage = 'Start an active challenge run first';
      return;
    }
    if (!Number.isInteger(reps) || reps <= 0) {
      this.feedbackMessage = 'Enter a positive whole number';
      return;
    }

    const boss = this.state.waypoints.find((wp) => wp.id === this.challengeRun!.bossWaypointId);
    if (!boss) return;

    this.challengeRun = { ...this.challengeRun, repsLogged: this.challengeRun.repsLogged + reps };

    if (reps >= (boss.bossMinReps || 0) && this.state.lifetimeReps >= boss.repsRequired) {
      boss.bossDefeated = true;
      const bonus = boss.bossBonusQP || 0;
      this.state.questPoints += bonus;
      this.challengeRun = { ...this.challengeRun, status: 'cleared' };
      this._pushSnapshot(`Cleared boss ${boss.id}`);
      this._notify(`Boss defeated! +${bonus} quest points`);
      this._save();
    } else if (reps >= (boss.bossMinReps || 0)) {
      this.feedbackMessage = `Reach waypoint ${boss.id} in quest mode before clearing this boss`;
    } else {
      this.feedbackMessage = `Need ${boss.bossMinReps}+ reps in one set to clear this boss`;
    }
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
    this._notify(scenario.label);
  }

  logReps(reps: number): void {
    if (this.gameMode === 'challenge') {
      this.feedbackMessage = 'Switch to quest mode to log adventure reps';
      return;
    }

    if (!Number.isInteger(reps) || reps <= 0) {
      this.feedbackMessage = 'Enter a positive whole number';
      return;
    }

    const prevLifetime = this.state.lifetimeReps;
    const newLifetime = prevLifetime + reps;
    const prevWpIdx = getCurrentWaypointIndex(this.state);

    const today = getLocalDate();
    const set: RepSet = {
      id: `set-${this.state.nextSetId}`,
      reps,
      timestamp: Date.now(),
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
          this._notify(`Boss defeated! +${bonus} quest points!`);
        }
      }
    }

    this.state.lifetimeReps = newLifetime;
    this.state.questPoints += reps;

    const newWpIdx = getCurrentWaypointIndex(this.state);
    for (let i = Math.max(0, prevWpIdx + 1); i <= newWpIdx; i++) {
      const wp = this.state.waypoints[i];
      const zone = this.state.zones.find((z) => z.id === wp.zoneId);
      if (zone && !this.state.unlockedZoneIds.includes(zone.id)) {
        this.state.unlockedZoneIds.push(zone.id);
        if (!this.state.zoneUnlockMessages.includes(zone.id)) {
          this.state.zoneUnlockMessages.push(zone.id);
          this._notify(`Zone Unlocked: ${zone.name}!`);
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

    this._pushSnapshot('Deleted set');
    this._save();
    this._notify('Set deleted');
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
    this.state.lastGoalMetDate = (dateReps.get(today) || 0) >= this.state.dailyGoal ? today : this.state.lastGoalMetDate;
  }

  buyGear(gearId: string): void {
    const gear = this.state.gear.find((g) => g.id === gearId);
    if (!gear || gear.unlocked) return;
    if (this.state.questPoints < gear.cost) {
      this.feedbackMessage = 'Not enough quest points';
      return;
    }

    gear.unlocked = true;
    this.state.questPoints -= gear.cost;
    this._pushSnapshot(`Bought ${gear.name}`);
    this._save();
    this._notify(`Unlocked: ${gear.name}!`);
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
  }

  updateDailyGoal(goal: number): void {
    if (!Number.isInteger(goal) || goal <= 0) return;
    this.state.dailyGoal = goal;
    this._pushSnapshot('Updated daily goal');
    this._save();
  }

  toggleDailyReminder(): void {
    this.state.dailyReminder = !this.state.dailyReminder;
    this._save();
  }

  updateReminderHour(hour: number): void {
    if (hour < 0 || hour > 23) return;
    this.state.reminderHour = hour;
    this._save();
  }

  resetQuest(): void {
    const defaults = createDefaultState();
    this._restoreState(defaults);
    this.branches = [{ id: 'main', label: 'Main', snapshots: [], currentIndex: 0 }];
    this.activeBranchId = 'main';
    this.gameMode = 'quest';
    this.challengeRun = null;
    this.scenarioStep = 0;
    this._ensureInitialSnapshot();
    this._save();
    this._saveHistory();
    this._notify('Quest reset! Starting fresh.');
  }
}

export const quest = new QuestStore();
