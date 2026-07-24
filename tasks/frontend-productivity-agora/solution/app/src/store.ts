import { createStore } from "solid-js/store";

// ── Types ────────────────────────────────────────────────────────────────────

export type Virtue = "Wisdom" | "Courage" | "Justice" | "Temperance";

export interface JournalEntry {
  id: string;
  date: string;          // ISO date string YYYY-MM-DD
  prompt: string;
  response: string;
  virtue: Virtue;
  createdAt: number;     // timestamp for ordering
}

export interface MeditationSession {
  date: string;          // YYYY-MM-DD
  completedAt: number;
}

export interface AppState {
  // Quotes
  quoteQueue: number[];          // remaining indices not yet shown
  currentQuoteIndex: number;
  favoriteQuoteIds: number[];

  // Journal
  entries: JournalEntry[];

  // Meditation
  sessions: MeditationSession[];

  // Streak
  streak: number;
  lastActivityDate: string;      // YYYY-MM-DD

  // Recovery
  recoveryNotice: string;
}

// ── STORAGE KEY ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "agora_state_v1";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function safeLocalGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeLocalSet(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

// ── QUOTE LIST ────────────────────────────────────────────────────────────────

export const QUOTES: { text: string; author: string }[] = [
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "He who laughs at himself never runs out of things to laugh at.", author: "Epictetus" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Goethe" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Courage is not the absence of fear but the judgment that something else is more important.", author: "Ambrose Redmoon" },
  { text: "Do not wait to strike till the iron is hot; make it hot by striking.", author: "William Butler Yeats" },
  { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Laozi" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Out of suffering have emerged the strongest souls.", author: "Kahlil Gibran" },
  { text: "Silence is the sleep that nourishes wisdom.", author: "Francis Bacon" },
];

// ── INITIAL STATE ─────────────────────────────────────────────────────────────

function buildInitialQueue(exclude: number): number[] {
  const all = Array.from({ length: QUOTES.length }, (_, i) => i).filter(i => i !== exclude);
  return shuffle(all);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function defaultState(): AppState {
  const startIndex = Math.floor(Math.random() * QUOTES.length);
  return {
    quoteQueue: buildInitialQueue(startIndex),
    currentQuoteIndex: startIndex,
    favoriteQuoteIds: [],
    entries: [],
    sessions: [],
    streak: 0,
    lastActivityDate: "",
    recoveryNotice: "",
  };
}

// ── LOAD / SAVE ───────────────────────────────────────────────────────────────

function loadState(): { state: AppState; notice: string } {
  const raw = safeLocalGet(STORAGE_KEY);
  if (!raw) return { state: defaultState(), notice: "" };

  try {
    const parsed = JSON.parse(raw);

    // Validate required shape
    if (
      typeof parsed !== "object" || parsed === null ||
      !Array.isArray(parsed.entries) ||
      !Array.isArray(parsed.sessions) ||
      !Array.isArray(parsed.quoteQueue) ||
      typeof parsed.streak !== "number"
    ) {
      throw new Error("invalid shape");
    }

    // Validate each entry
    const virtueSet = new Set<string>(["Wisdom", "Courage", "Justice", "Temperance"]);
    const entries: JournalEntry[] = parsed.entries.filter((e: unknown) => {
      if (typeof e !== "object" || e === null) return false;
      const entry = e as Record<string, unknown>;
      return (
        typeof entry.id === "string" &&
        typeof entry.date === "string" &&
        typeof entry.prompt === "string" &&
        typeof entry.response === "string" &&
        virtueSet.has(entry.virtue as string) &&
        typeof entry.createdAt === "number"
      );
    });

    const sessions: MeditationSession[] = parsed.sessions.filter((s: unknown) => {
      if (typeof s !== "object" || s === null) return false;
      const sess = s as Record<string, unknown>;
      return typeof sess.date === "string" && typeof sess.completedAt === "number";
    });

    const favIds: number[] = Array.isArray(parsed.favoriteQuoteIds)
      ? parsed.favoriteQuoteIds.filter((x: unknown) => typeof x === "number")
      : [];

    const state: AppState = {
      quoteQueue: Array.isArray(parsed.quoteQueue)
        ? parsed.quoteQueue.filter((x: unknown) => typeof x === "number")
        : buildInitialQueue(typeof parsed.currentQuoteIndex === "number" ? parsed.currentQuoteIndex : 0),
      currentQuoteIndex: typeof parsed.currentQuoteIndex === "number" ? parsed.currentQuoteIndex : 0,
      favoriteQuoteIds: favIds,
      entries,
      sessions,
      streak: parsed.streak ?? 0,
      lastActivityDate: typeof parsed.lastActivityDate === "string" ? parsed.lastActivityDate : "",
      recoveryNotice: "",
    };

    const droppedEntries = parsed.entries.length - entries.length;
    const droppedSessions = parsed.sessions.length - sessions.length;
    const notice = (droppedEntries > 0 || droppedSessions > 0)
      ? `Recovered from corrupted data: removed ${droppedEntries} invalid journal entries and ${droppedSessions} invalid sessions.`
      : "";

    return { state, notice };
  } catch {
    return {
      state: { ...defaultState(), recoveryNotice: "Corrupted saved data was detected. Starting fresh." },
      notice: "Corrupted saved data was detected. Starting fresh.",
    };
  }
}

function saveState(state: AppState): void {
  safeLocalSet(STORAGE_KEY, JSON.stringify({
    quoteQueue: state.quoteQueue,
    currentQuoteIndex: state.currentQuoteIndex,
    favoriteQuoteIds: state.favoriteQuoteIds,
    entries: state.entries,
    sessions: state.sessions,
    streak: state.streak,
    lastActivityDate: state.lastActivityDate,
  }));
}

// ── STORE ─────────────────────────────────────────────────────────────────────

const { state: loadedState, notice } = loadState();
if (notice) loadedState.recoveryNotice = notice;

export const [store, setStore] = createStore<AppState>(loadedState);

function persist() {
  saveState(store);
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────

export function nextQuote() {
  let queue = [...store.quoteQueue];
  let nextIdx: number;
  if (queue.length === 0) {
    // Rebuild queue, excluding current
    queue = buildInitialQueue(store.currentQuoteIndex);
  }
  nextIdx = queue[queue.length - 1];
  queue = queue.slice(0, -1);
  setStore("quoteQueue", queue);
  setStore("currentQuoteIndex", nextIdx);
  persist();
}

export function toggleFavorite(quoteId: number) {
  const favs = store.favoriteQuoteIds;
  if (favs.includes(quoteId)) {
    setStore("favoriteQuoteIds", favs.filter(id => id !== quoteId));
  } else {
    setStore("favoriteQuoteIds", [...favs, quoteId]);
  }
  persist();
}

function updateStreak() {
  const today = todayStr();
  if (store.lastActivityDate === today) return; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = store.lastActivityDate === yesterdayStr ? store.streak + 1 : 1;
  setStore("streak", newStreak);
  setStore("lastActivityDate", today);
}

export function saveEntry(entry: Omit<JournalEntry, "id" | "date" | "createdAt">) {
  const newEntry: JournalEntry = {
    ...entry,
    id: crypto.randomUUID(),
    date: todayStr(),
    createdAt: Date.now(),
  };
  setStore("entries", [newEntry, ...store.entries]);
  updateStreak();
  persist();
}

export function updateEntry(id: string, updates: Partial<Pick<JournalEntry, "response" | "virtue" | "prompt">>) {
  setStore("entries", e => e.id === id, updates);
  persist();
}

export function deleteEntry(id: string) {
  setStore("entries", store.entries.filter(e => e.id !== id));
  persist();
}

export function recordMeditationSession() {
  const session: MeditationSession = {
    date: todayStr(),
    completedAt: Date.now(),
  };
  setStore("sessions", [...store.sessions, session]);
  updateStreak();
  persist();
}

export function clearRecoveryNotice() {
  setStore("recoveryNotice", "");
}

export function resetAllData() {
  const fresh = defaultState();
  setStore(fresh);
  persist();
}

export function retryLoad() {
  // Re-attempt loading from localStorage
  const { state, notice } = loadState();
  setStore(state);
  if (notice) setStore("recoveryNotice", notice);
  persist();
}

export function loadMalformedSample() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      quoteQueue: "not-an-array",
      currentQuoteIndex: 0,
      favoriteQuoteIds: [0, 1],
      entries: [
        { id: "bad1", date: "2024-01-01", prompt: "Test", response: "Valid entry", virtue: "Wisdom", createdAt: 1000 },
        { id: "bad2", date: "2024-01-02", prompt: "Test", virtue: "InvalidVirtue", createdAt: 2000 },
        "not-an-object",
        { id: "bad3", response: "Missing fields" },
      ],
      sessions: [
        { date: "2024-01-01", completedAt: 1000 },
        { invalid: true },
        "garbage",
      ],
      streak: 5,
      lastActivityDate: "2024-01-01",
    }));
    // Now reload
    const { state, notice } = loadState();
    setStore(state);
    const msg = notice || "Malformed sample loaded — some entries were recoverable.";
    setStore("recoveryNotice", msg);
  } catch {
    setStore("recoveryNotice", "Failed to inject malformed sample.");
  }
}

// ── DERIVED HELPERS ───────────────────────────────────────────────────────────

export function getWeeklySummary() {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const meditationCount = store.sessions.filter(s => s.completedAt >= sevenDaysAgo).length;
  const journalCount = store.entries.filter(e => e.createdAt >= sevenDaysAgo).length;
  return { meditationCount, journalCount };
}

export function getVirtueStats() {
  const virtues: Virtue[] = ["Wisdom", "Courage", "Justice", "Temperance"];
  return virtues.map(v => ({
    virtue: v,
    count: store.entries.filter(e => e.virtue === v).length,
  }));
}
