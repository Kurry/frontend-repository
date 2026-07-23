import { create } from 'zustand';
import { buildArtifacts } from './artifacts';

// ---------------------------------------------------------------------------
// Deterministic helpers (no Math.random / Date.now in fixture or id space)
// ---------------------------------------------------------------------------

export const fnv1a = (str: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};

export const mediaHashFor = (id: string, name: string, duration: number): string =>
  fnv1a(`side-street-signals/${id}/${name}/${duration}`) + fnv1a(`${duration}/${name}/${id}`);

let seq = 1000;
export const nextId = (prefix: string) => `${prefix}-${++seq}`;

export const TIMELINE_SPAN = 360000; // ms shown on the board
export const SAMPLE_STEP = 30000;
export const PUBLISH_DATE = '2026-08-01';

export type LaneType = 'dialogue' | 'crosstalk' | 'music' | 'ambient' | 'marker';
export const LANES: LaneType[] = ['dialogue', 'crosstalk', 'music', 'ambient', 'marker'];
export const AUTOMATION_LANES: LaneType[] = ['dialogue', 'music', 'ambient'];

export type SnapMode = 'ms10' | 'token' | 'chapter';
export type Mode =
  | 'sources' | 'timeline' | 'transcript' | 'chapters'
  | 'mix' | 'rights' | 'branches' | 'render' | 'export';

export interface Token {
  id: string;
  sourceId: string;
  idx: number;
  text: string;
  start: number; // source-relative ms
  end: number;
}

export interface TokenState {
  included: boolean;
  correction?: { text: string; note: string; by: string; rev: number };
}

export interface Source {
  id: string;
  name: string;
  speaker: string;
  type: LaneType;
  duration: number;
  transcriptSnippet: string;
  rightsState: 'allowed' | 'forbidden';
  mediaHash: string;
  allowedUsage: string;
  territory: string;
  attribution: string;
  expiryDaysAfterPublish: number;
}

export interface Instance {
  id: string;
  sourceId: string;
  lane: LaneType;
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
  gain: number;      // dB
  fadeIn: number;    // ms
  fadeOut: number;   // ms
  mute: boolean;
  crossfade: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  role: string;
  start: number;
  end: number;
  speakers: string[];
  topics: string[];
  summary: string;
}

export interface Citation {
  id: string;
  label: string;
  note: string;
  status: 'bound' | 'orphan';
  span: { sourceId: string; startMs: number; endMs: number; text: string } | null;
}

export interface AutomationPoint { id: string; t: number; v: number }

export type ApprovalCat = 'transcript' | 'editorial' | 'rights' | 'accessibility' | 'master';
export const APPROVAL_CATS: ApprovalCat[] = ['transcript', 'editorial', 'rights', 'accessibility', 'master'];

export interface Approval {
  status: 'approved' | 'unapproved' | 'stale';
  checksum: string;
  staleReason?: string;
}

export type OutputKey = 'master' | 'transcriptTimestamps' | 'chapterMarks' | 'artworkManifest' | 'rssEnclosure';
export const OUTPUT_KEYS: OutputKey[] = ['master', 'transcriptTimestamps', 'chapterMarks', 'artworkManifest', 'rssEnclosure'];
export const OUTPUT_LABELS: Record<OutputKey, string> = {
  master: 'Audio Master',
  transcriptTimestamps: 'Transcript Timestamps',
  chapterMarks: 'Chapter Marks',
  artworkManifest: 'Artwork Manifest',
  rssEnclosure: 'RSS Enclosure',
};

export interface RenderPipeline {
  status: 'idle' | 'running' | 'failed' | 'success';
  attempts: { n: number; kind: 'full' | 'failed-only'; results: Record<OutputKey, 'failed' | 'success' | 'preserved'> }[];
  outputs: Record<OutputKey, 'pending' | 'failed' | 'success'>;
  blockedReason?: string;
}

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  actionId?: string; // 'undo-delete'
}

export interface HistoryEntry { rev: number; action: string; detail: string }

export interface CutSnapshot {
  instances: Instance[];
  tokenState: Record<string, TokenState>;
  citations: Citation[];
  chapters: Chapter[];
  automation: Record<string, AutomationPoint[]>;
  notes: string;
  rights: Record<string, Pick<Source, 'allowedUsage' | 'territory' | 'attribution' | 'expiryDaysAfterPublish' | 'rightsState'>>;
}

// ---------------------------------------------------------------------------
// Fixtures — Side Street Signals episode "Night Market Economies"
// ---------------------------------------------------------------------------

const SPEAKERS = ['Mara Voss (Host)', 'Deion Park (Guest)', 'Alina Reyes (Producer)'];

const SENTENCES = [
  'Welcome back to Side Street Signals where the city talks after dark and we listen closely',
  'The night market reopened in spring and every stall keeper remembers the exact evening it happened',
  'Nobody planned for the lantern rows to become the busiest corridor on the whole street again',
  'We followed the money from the first espresso cart to the last vinyl stand before sunrise',
  'You can hear the generators hum under every interview we taped along the canal side',
  'This economy runs on trust and small change and the occasional borrowed extension cord',
];

const tokensForSource = (sourceId: string, sIdx: number): Token[] => {
  const words = SENTENCES[sIdx % SENTENCES.length].split(' ');
  return words.map((w, i) => ({
    id: `tok-${sourceId}-${i}`,
    sourceId,
    idx: i,
    // deterministic fixture error: clip 2 token 5 is misspelled on purpose
    text: sIdx === 1 && i === 5 ? 'evning' : w,
    start: i * 400,
    end: (i + 1) * 400,
  }));
};

const buildSources = (): { sources: Source[]; tokens: Token[] } => {
  const sources: Source[] = [];
  const tokens: Token[] = [];
  for (let i = 0; i < 24; i++) {
    const id = `source-${i + 1}`;
    const type: LaneType = i < 18 ? 'dialogue' : i < 21 ? 'music' : 'ambient';
    const name = `Clip ${i + 1}`;
    const duration = 15000 + i * 1000;
    const snippetWords = SENTENCES[i % SENTENCES.length].split(' ').slice(0, 6).join(' ');
    sources.push({
      id,
      name,
      speaker: type === 'dialogue' ? SPEAKERS[i % 3] : type === 'music' ? 'Score' : 'Field Recording',
      type,
      duration,
      transcriptSnippet: type === 'dialogue' ? `${snippetWords}…` : type === 'music' ? 'Instrumental — no transcript' : 'Ambience — no transcript',
      rightsState: i === 5 ? 'forbidden' : 'allowed',
      mediaHash: mediaHashFor(id, name, duration),
      allowedUsage: i === 18 ? 'Podcast Only' : 'Podcast + Web',
      territory: i === 19 ? 'US + EU' : 'Worldwide',
      attribution: i === 12 ? '' : `Recorded by Side Street Signals — ${name}`,
      expiryDaysAfterPublish: 365,
    });
    if (type === 'dialogue') tokens.push(...tokensForSource(id, i));
  }
  return { sources, tokens };
};

const FIXTURES = buildSources();

const INITIAL_CHAPTERS: Chapter[] = [
  { id: 'chap-1', title: 'Cold Open', role: 'cold-open', start: 0, end: 30000, speakers: ['Mara Voss (Host)'], topics: ['teaser'], summary: 'A generator hums to life as the first stall opens.' },
  { id: 'chap-2', title: 'Introduction', role: 'introduction', start: 30000, end: 70000, speakers: ['Mara Voss (Host)'], topics: ['framing'], summary: 'Mara frames the night market as a shadow economy.' },
  { id: 'chap-3', title: 'Chapter 1 — The Reopening', role: 'chapter', start: 70000, end: 150000, speakers: ['Deion Park (Guest)'], topics: ['reopening', 'spring'], summary: 'Deion recalls the spring evening the lantern rows returned.' },
  { id: 'chap-4', title: 'Chapter 2 — Cash And Trust', role: 'chapter', start: 150000, end: 230000, speakers: ['Mara Voss (Host)', 'Deion Park (Guest)'], topics: ['money', 'trust'], summary: 'Following small change from espresso carts to vinyl stands.' },
  { id: 'chap-5', title: 'Chapter 3 — After Sunrise', role: 'chapter', start: 230000, end: 310000, speakers: ['Alina Reyes (Producer)'], topics: ['aftermath'], summary: 'What the street keeps when the stalls pack up.' },
  { id: 'chap-6', title: 'Transition', role: 'transition', start: 310000, end: 325000, speakers: [], topics: ['score'], summary: 'Score bridge into credits.' },
  { id: 'chap-7', title: 'Credits', role: 'credits', start: 325000, end: 350000, speakers: ['Mara Voss (Host)'], topics: ['credits'], summary: 'Production credits and attributions.' },
];

const INITIAL_AUTOMATION: Record<string, AutomationPoint[]> = {
  dialogue: [
    { id: 'ap-d1', t: 0, v: -16 },
    { id: 'ap-d2', t: 150000, v: -16 },
    { id: 'ap-d3', t: 300000, v: -16 },
  ],
  music: [
    { id: 'ap-m1', t: 0, v: -24 },
    { id: 'ap-m2', t: 150000, v: -26 },
    { id: 'ap-m3', t: 300000, v: -24 },
  ],
  ambient: [
    { id: 'ap-a1', t: 0, v: -30 },
    { id: 'ap-a2', t: 300000, v: -30 },
  ],
};

const INITIAL_INSTANCES: Instance[] = [
  { id: 'inst-1', sourceId: 'source-1', lane: 'dialogue', start: 0, end: 10000, sourceStart: 0, sourceEnd: 10000, gain: 0, fadeIn: 200, fadeOut: 200, mute: false, crossfade: false },
  { id: 'inst-2', sourceId: 'source-6', lane: 'dialogue', start: 10000, end: 20000, sourceStart: 0, sourceEnd: 10000, gain: 0, fadeIn: 0, fadeOut: 0, mute: false, crossfade: false },
  { id: 'inst-3', sourceId: 'source-1', lane: 'dialogue', start: 22000, end: 28000, sourceStart: 2000, sourceEnd: 8000, gain: -1, fadeIn: 100, fadeOut: 100, mute: false, crossfade: false },
  { id: 'inst-4', sourceId: 'source-19', lane: 'music', start: 0, end: 60000, sourceStart: 0, sourceEnd: 33000, gain: -2, fadeIn: 1000, fadeOut: 2000, mute: false, crossfade: false },
  { id: 'inst-5', sourceId: 'source-22', lane: 'ambient', start: 0, end: 30000, sourceStart: 0, sourceEnd: 30000, gain: -4, fadeIn: 500, fadeOut: 500, mute: false, crossfade: false },
];

const initialTokenState = (): Record<string, TokenState> => {
  const s: Record<string, TokenState> = {};
  FIXTURES.tokens.forEach(t => { s[t.id] = { included: true }; });
  return s;
};

const INITIAL_CITATIONS: Citation[] = [
  { id: 'cite-1', label: 'Reopening quote', note: 'Claim: the market reopened in spring.', status: 'orphan', span: null },
];

const INITIAL_APPROVALS = (): Record<ApprovalCat, Approval> => ({
  transcript: { status: 'unapproved', checksum: '' },
  editorial: { status: 'unapproved', checksum: '' },
  rights: { status: 'unapproved', checksum: '' },
  accessibility: { status: 'unapproved', checksum: '' },
  master: { status: 'unapproved', checksum: '' },
});

const INITIAL_RENDER = (): RenderPipeline => ({
  status: 'idle',
  attempts: [],
  outputs: { master: 'pending', transcriptTimestamps: 'pending', chapterMarks: 'pending', artworkManifest: 'pending', rssEnclosure: 'pending' },
});

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

export const lerpAutomation = (points: AutomationPoint[], t: number): number => {
  if (!points.length) return -60;
  const sorted = [...points].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].v;
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].v;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      if (b.t === a.t) return b.v;
      const f = (t - a.t) / (b.t - a.t);
      return Math.round((a.v + f * (b.v - a.v)) * 10) / 10;
    }
  }
  return sorted[sorted.length - 1].v;
};

const PEAK_OFFSET: Record<string, number> = { dialogue: 5, music: 3, ambient: 2 };

export interface MixSample { t: number; lane: LaneType; loudness: number | null; peak: number | null }

export const sampleMix = (state: Pick<AppState, 'instances' | 'automation' | 'laneFlags'>): MixSample[] => {
  const samples: MixSample[] = [];
  for (const lane of AUTOMATION_LANES) {
    for (let t = 0; t <= 300000; t += SAMPLE_STEP) {
      const clip = state.instances.find(i => i.lane === lane && !i.mute && i.start <= t && i.end > t);
      const laneMuted = state.laneFlags[lane]?.mute;
      const soloed = AUTOMATION_LANES.some(l => state.laneFlags[l]?.solo);
      const audible = clip && !laneMuted && (!soloed || state.laneFlags[lane]?.solo);
      const loudness = audible ? Math.round((lerpAutomation(state.automation[lane] ?? [], t) + clip!.gain) * 10) / 10 : null;
      samples.push({ t, lane, loudness, peak: loudness === null ? null : Math.round((loudness + PEAK_OFFSET[lane]) * 10) / 10 });
    }
  }
  return samples;
};

export const cutChecksum = (s: Pick<AppState, 'instances' | 'tokenState' | 'citations' | 'chapters' | 'automation' | 'notes'>): string =>
  fnv1a(JSON.stringify({ i: s.instances, k: s.tokenState, c: s.citations, h: s.chapters, a: s.automation, n: s.notes }));

export const tokensOfSource = (sourceId: string): Token[] => FIXTURES.tokens.filter(t => t.sourceId === sourceId);

export const episodeEnd = (instances: Instance[]): number =>
  instances.length ? Math.max(...instances.map(i => i.end)) : 0;

// snap a time according to mode; result is always an integer ms
export const snapTime = (t: number, mode: SnapMode, chapters: Chapter[]): number => {
  const v = Math.max(0, Math.round(t));
  if (mode === 'ms10') return Math.round(v / 10) * 10;
  if (mode === 'token') return Math.round(v / 400) * 400;
  const marks = chapters.flatMap(c => [c.start, c.end]);
  if (!marks.length) return Math.round(v / 10) * 10;
  let best = marks[0];
  for (const m of marks) if (Math.abs(m - v) < Math.abs(best - v)) best = m;
  return Math.abs(best - v) <= 5000 ? best : Math.round(v / 10) * 10;
};

const takeSnapshot = (s: AppState): CutSnapshot => ({
  instances: JSON.parse(JSON.stringify(s.instances)),
  tokenState: JSON.parse(JSON.stringify(s.tokenState)),
  citations: JSON.parse(JSON.stringify(s.citations)),
  chapters: JSON.parse(JSON.stringify(s.chapters)),
  automation: JSON.parse(JSON.stringify(s.automation)),
  notes: s.notes,
  rights: Object.fromEntries(s.sources.map(src => [src.id, {
    allowedUsage: src.allowedUsage, territory: src.territory, attribution: src.attribution,
    expiryDaysAfterPublish: src.expiryDaysAfterPublish, rightsState: src.rightsState,
  }])),
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface AppState {
  sources: Source[];
  tokens: Token[];
  tokenState: Record<string, TokenState>;
  instances: Instance[];
  chapters: Chapter[];
  citations: Citation[];
  automation: Record<string, AutomationPoint[]>;
  approvals: Record<ApprovalCat, Approval>;
  renderPipeline: RenderPipeline;
  branch: string;
  forks: Record<string, CutSnapshot>;
  notes: string;
  laneFlags: Record<string, { mute: boolean; solo: boolean }>;
  history: HistoryEntry[];
  rev: number;
  toasts: Toast[];
  mode: Mode;
  selectedInstance: string | null;
  snapMode: SnapMode;
  theme: 'dark' | 'light';
  accent: 'violet' | 'sky' | 'amber';
  showHints: boolean;
  sourceRanges: Record<string, { in: number; out: number }>;
  tokenSel: { sourceId: string; fromIdx: number; toIdx: number } | null;
  insertError: string | null;
  reorderPreview: { id: string; dir: -1 | 1; next: Chapter[]; moved: { title: string; from: [number, number]; to: [number, number] }[] } | null;
  mergeChoices: Record<string, 'main' | 'fork'>;
  importError: string[] | null;
  exportOutputs: Record<string, string>;
  lastCompanions: Record<string, string> | null;
  companionsIdentical: boolean | null;
  undoStack: { instance: Instance }[];
}

export interface AppActions {
  log: (action: string, detail: string) => void;
  addToast: (kind: Toast['kind'], message: string, actionLabel?: string, actionId?: string) => void;
  removeToast: (id: string) => void;
  toastAction: (id: string) => void;
  setMode: (m: Mode) => void;
  setTheme: (t: 'dark' | 'light') => void;
  setAccent: (a: 'violet' | 'sky' | 'amber') => void;
  setSnapMode: (m: SnapMode) => void;
  setShowHints: (b: boolean) => void;
  setSourceRange: (sourceId: string, inMs: number, outMs: number) => void;
  insertInstance: (sourceId: string, lane?: LaneType, start?: number) => { ok: boolean; id?: string; error?: string };
  selectInstance: (id: string | null) => void;
  updateInstance: (id: string, patch: Partial<Instance>, actionName?: string) => void;
  trimInstance: (id: string, edge: 'start' | 'end', delta: number) => void;
  moveInstance: (id: string, delta: number) => void;
  rippleMove: (id: string, delta: number) => void;
  gapClose: (id: string) => void;
  splitInstance: (id: string, atMs?: number) => void;
  deleteInstance: (id: string) => void;
  undoDelete: () => void;
  toggleMuteInstance: (id: string) => void;
  setLaneFlag: (lane: LaneType, flag: 'mute' | 'solo') => void;
  toggleToken: (tokenId: string) => void;
  correctToken: (tokenId: string, text: string, note: string) => void;
  setTokenSel: (sel: AppState['tokenSel']) => void;
  bindSpan: (citationId?: string) => { ok: boolean; error?: string };
  fixCitation: (id: string) => void;
  updateChapter: (id: string, patch: Partial<Chapter>) => void;
  requestReorder: (id: string, dir: -1 | 1) => void;
  confirmReorder: () => void;
  cancelReorder: () => void;
  setAutomationPoint: (lane: LaneType, pointId: string, t: number, v: number) => void;
  addAutomationPoint: (lane: LaneType) => void;
  deleteAutomationPoint: (lane: LaneType, pointId: string) => void;
  setRights: (sourceId: string, patch: Partial<Pick<Source, 'allowedUsage' | 'territory' | 'attribution' | 'expiryDaysAfterPublish'>>) => void;
  setNotes: (n: string) => void;
  approvalBlockers: (cat: ApprovalCat) => string[];
  approveCategory: (cat: ApprovalCat) => { ok: boolean; blockers?: string[] };
  markStale: (action: string) => void;
  startRender: () => { ok: boolean; error?: string };
  retryFailed: () => { ok: boolean; error?: string };
  branchCut: (name?: string) => void;
  switchBranch: (name: string) => void;
  setMergeChoice: (category: string, pick: 'main' | 'fork') => void;
  applyMerge: () => void;
  generateExport: () => void;
  importData: (data: string) => { ok: boolean; errors?: string[] };
  resetAll: () => void;
}

export type Store = AppState & AppActions;

const material = (s: Store, action: string, detail: string) => {
  s.log(action, detail);
  s.markStale(action);
};

export const useStore = create<Store>((set, get) => ({
  sources: FIXTURES.sources,
  tokens: FIXTURES.tokens,
  tokenState: initialTokenState(),
  instances: INITIAL_INSTANCES,
  chapters: INITIAL_CHAPTERS,
  citations: INITIAL_CITATIONS,
  automation: INITIAL_AUTOMATION,
  approvals: INITIAL_APPROVALS(),
  renderPipeline: INITIAL_RENDER(),
  branch: 'main',
  forks: {},
  notes: 'Night Market Economies — how a street economy rebuilt itself one lantern at a time.',
  laneFlags: { dialogue: { mute: false, solo: false }, crosstalk: { mute: false, solo: false }, music: { mute: false, solo: false }, ambient: { mute: false, solo: false }, marker: { mute: false, solo: false } },
  history: [],
  rev: 0,
  toasts: [],
  mode: 'timeline',
  selectedInstance: null,
  snapMode: 'ms10',
  theme: 'dark',
  accent: 'violet',
  showHints: true,
  sourceRanges: {},
  tokenSel: null,
  insertError: null,
  reorderPreview: null,
  mergeChoices: {},
  importError: null,
  exportOutputs: {},
  lastCompanions: null,
  companionsIdentical: null,
  undoStack: [],

  log: (action, detail) => set(s => ({
    rev: s.rev + 1,
    history: [{ rev: s.rev + 1, action, detail }, ...s.history].slice(0, 60),
  })),

  addToast: (kind, message, actionLabel, actionId) => set(s => ({
    toasts: [...s.toasts, { id: nextId('toast'), kind, message, actionLabel, actionId }].slice(-4),
  })),
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  toastAction: (id) => {
    const t = get().toasts.find(x => x.id === id);
    get().removeToast(id);
    if (t?.actionId === 'undo-delete') get().undoDelete();
  },

  setMode: (m) => set({ mode: m }),
  setTheme: (t) => { set({ theme: t }); get().log('theme', `Switched to ${t} theme`); },
  setAccent: (a) => { set({ accent: a }); get().log('accent', `Accent set to ${a}`); },
  setSnapMode: (m) => { set({ snapMode: m }); get().log('snap', `Snap mode set to ${m}`); },
  setShowHints: (b) => set({ showHints: b }),

  setSourceRange: (sourceId, inMs, outMs) => set(s => {
    const src = s.sources.find(x => x.id === sourceId);
    if (!src) return s;
    const lo = Math.max(0, Math.min(Math.round(inMs), src.duration - 10));
    const hi = Math.max(lo + 10, Math.min(Math.round(outMs), src.duration));
    return { sourceRanges: { ...s.sourceRanges, [sourceId]: { in: lo, out: hi } } };
  }),

  insertInstance: (sourceId, lane, start) => {
    const s = get();
    const src = s.sources.find(x => x.id === sourceId);
    if (!src) return { ok: false, error: 'Unknown source' };
    if (src.rightsState === 'forbidden') {
      const error = `${src.name} has forbidden rights — clear the rights record before inserting it.`;
      set({ insertError: error });
      s.addToast('error', error);
      s.log('insert-blocked', error);
      return { ok: false, error };
    }
    const range = s.sourceRanges[sourceId] ?? { in: 0, out: Math.min(10000, src.duration) };
    const targetLane: LaneType = lane ?? src.type;
    const laneEnd = s.instances.filter(i => i.lane === targetLane).reduce((m, i) => Math.max(m, i.end), 0);
    const at = snapTime(start ?? laneEnd, s.snapMode, s.chapters);
    const id = nextId('inst');
    const inst: Instance = {
      id, sourceId, lane: targetLane,
      start: at, end: at + (range.out - range.in),
      sourceStart: range.in, sourceEnd: range.out,
      gain: 0, fadeIn: 0, fadeOut: 0, mute: false, crossfade: false,
    };
    set(st => ({ instances: [...st.instances, inst], insertError: null, selectedInstance: id }));
    material(get(), 'insert', `Inserted ${src.name} [${range.in}–${range.out} ms] into ${targetLane} at ${at} ms (source untouched, hash ${src.mediaHash.slice(0, 8)})`);
    get().addToast('success', `${src.name} inserted into ${targetLane} at ${at} ms.`);
    return { ok: true, id };
  },

  selectInstance: (id) => set({ selectedInstance: id, tokenSel: null }),

  updateInstance: (id, patch, actionName = 'edit') => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    const src = inst && s.sources.find(x => x.id === inst.sourceId);
    if (!inst || !src) return;
    const p: Partial<Instance> = { ...patch };
    if (p.start !== undefined) p.start = Math.max(0, Math.round(p.start));
    if (p.end !== undefined) p.end = Math.round(p.end);
    if (p.sourceStart !== undefined) p.sourceStart = Math.min(Math.max(0, Math.round(p.sourceStart)), src.duration - 10);
    if (p.sourceEnd !== undefined) p.sourceEnd = Math.min(Math.max(10, Math.round(p.sourceEnd)), src.duration);
    const next = { ...inst, ...p };
    if (next.end <= next.start) next.end = next.start + 10;
    if (next.sourceEnd <= next.sourceStart) next.sourceEnd = next.sourceStart + 10;
    // fades obey clip bounds
    const dur = next.end - next.start;
    next.fadeIn = Math.min(Math.max(0, Math.round(next.fadeIn)), dur);
    next.fadeOut = Math.min(Math.max(0, Math.round(next.fadeOut)), Math.max(0, dur - next.fadeIn));
    set(st => ({ instances: st.instances.map(i => i.id === id ? next : i) }));
    material(get(), actionName, `${actionName} on ${id}: episode ${next.start}–${next.end} ms, source ${next.sourceStart}–${next.sourceEnd} ms`);
  },

  trimInstance: (id, edge, delta) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    if (edge === 'start') {
      const start = snapTime(inst.start + delta, s.snapMode, s.chapters);
      const sourceStart = inst.sourceStart + (start - inst.start);
      s.updateInstance(id, { start, sourceStart }, 'trim-start');
    } else {
      const end = snapTime(inst.end + delta, s.snapMode, s.chapters);
      const sourceEnd = inst.sourceEnd + (end - inst.end);
      s.updateInstance(id, { end, sourceEnd }, 'trim-end');
    }
  },

  moveInstance: (id, delta) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    const start = snapTime(inst.start + delta, s.snapMode, s.chapters);
    s.updateInstance(id, { start, end: start + (inst.end - inst.start) }, 'move');
  },

  rippleMove: (id, delta) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    const d = snapTime(inst.start + delta, s.snapMode, s.chapters) - inst.start;
    set(st => ({
      instances: st.instances.map(i =>
        i.start >= inst.start ? { ...i, start: Math.max(0, i.start + d), end: Math.max(10, i.end + d) } : i),
    }));
    material(get(), 'ripple-move', `Ripple move ${d > 0 ? '+' : ''}${d} ms from ${inst.start} ms — episode times shifted, source times unchanged`);
  },

  gapClose: (id) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    const prevEnd = s.instances
      .filter(i => i.lane === inst.lane && i.id !== id && i.end <= inst.start)
      .reduce((m, i) => Math.max(m, i.end), 0);
    if (prevEnd === inst.start) { s.addToast('info', 'No gap to close before this clip.'); return; }
    const d = prevEnd - inst.start;
    s.updateInstance(id, { start: inst.start + d, end: inst.end + d }, 'gap-close');
    s.addToast('success', `Gap closed: clip pulled ${Math.abs(d)} ms left.`);
  },

  splitInstance: (id, atMs) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    const rel = atMs !== undefined ? Math.round(atMs) : Math.round((inst.end - inst.start) / 2);
    const at = snapTime(inst.start + Math.min(Math.max(10, rel), inst.end - inst.start - 10), s.snapMode, s.chapters);
    if (at <= inst.start || at >= inst.end) { s.addToast('error', 'Split point must fall inside the clip.'); return; }
    const srcAt = inst.sourceStart + (at - inst.start);
    const right: Instance = { ...inst, id: nextId('inst'), start: at, sourceStart: srcAt, fadeIn: 0 };
    set(st => ({
      instances: st.instances.flatMap(i => i.id === id
        ? [{ ...i, end: at, sourceEnd: srcAt, fadeOut: 0 }, right]
        : [i]),
    }));
    material(get(), 'split', `Split ${id} at ${at} ms (source offset ${srcAt} ms)`);
  },

  deleteInstance: (id) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    set(st => ({
      instances: st.instances.filter(i => i.id !== id),
      undoStack: [...st.undoStack, { instance: inst }],
      selectedInstance: st.selectedInstance === id ? null : st.selectedInstance,
      // citations bound inside this instance's source range become orphans
      citations: st.citations.map(c =>
        c.span && c.span.sourceId === inst.sourceId &&
        !st.instances.some(i => i.id !== id && i.sourceId === inst.sourceId && i.sourceStart <= c.span!.startMs && i.sourceEnd >= c.span!.endMs)
          ? { ...c, status: 'orphan' as const }
          : c),
    }));
    material(get(), 'delete', `Removed ${id} from the timeline`);
    get().addToast('info', `Clip removed from the timeline.`, 'Undo', 'undo-delete');
  },

  undoDelete: () => {
    const s = get();
    const last = s.undoStack[s.undoStack.length - 1];
    if (!last) return;
    set(st => ({
      instances: [...st.instances, last.instance],
      undoStack: st.undoStack.slice(0, -1),
    }));
    material(get(), 'undo', `Restored ${last.instance.id}`);
    get().addToast('success', 'Clip restored.');
  },

  toggleMuteInstance: (id) => {
    const s = get();
    const inst = s.instances.find(i => i.id === id);
    if (!inst) return;
    s.updateInstance(id, { mute: !inst.mute }, inst.mute ? 'unmute' : 'mute');
  },

  setLaneFlag: (lane, flag) => {
    set(s => ({
      laneFlags: {
        ...s.laneFlags,
        [lane]: { ...s.laneFlags[lane], [flag]: !s.laneFlags[lane][flag] },
      },
    }));
    const on = get().laneFlags[lane][flag];
    get().log(`lane-${flag}`, `${lane} lane ${flag} ${on ? 'on' : 'off'}`);
    get().addToast('info', `${lane} lane ${flag} ${on ? 'enabled' : 'disabled'}.`);
  },

  toggleToken: (tokenId) => {
    set(s => ({
      tokenState: { ...s.tokenState, [tokenId]: { ...s.tokenState[tokenId], included: !s.tokenState[tokenId]?.included } },
    }));
    const st = get().tokenState[tokenId];
    material(get(), 'token-toggle', `Token ${tokenId} ${st.included ? 'included' : 'excluded'}`);
  },

  correctToken: (tokenId, text, note) => {
    const s = get();
    set(st => ({
      tokenState: {
        ...st.tokenState,
        [tokenId]: { ...st.tokenState[tokenId], correction: { text, note, by: 'You (editor)', rev: st.rev + 1 } },
      },
    }));
    material(get(), 'token-correct', `Token ${tokenId} corrected to "${text}" — ${note}`);
    s.addToast('success', `Token corrected to "${text}" with provenance recorded.`);
  },

  setTokenSel: (sel) => set({ tokenSel: sel }),

  bindSpan: (citationId) => {
    const s = get();
    const sel = s.tokenSel;
    if (!sel) {
      const error = 'Select a token span first: click a start token, then shift-click an end token.';
      s.addToast('error', error);
      return { ok: false, error };
    }
    const toks = tokensOfSource(sel.sourceId).filter(t => t.idx >= sel.fromIdx && t.idx <= sel.toIdx);
    if (!toks.length) return { ok: false, error: 'Empty span' };
    const span = {
      sourceId: sel.sourceId,
      startMs: toks[0].start,
      endMs: toks[toks.length - 1].end,
      text: toks.map(t => s.tokenState[t.id]?.correction?.text ?? t.text).join(' '),
    };
    const covered = s.instances.some(i => i.sourceId === sel.sourceId && i.sourceStart <= span.startMs && i.sourceEnd >= span.endMs);
    if (!covered) {
      const error = 'Span falls outside every clip range on the timeline — extend a clip to cover it first.';
      s.addToast('error', error);
      return { ok: false, error };
    }
    if (citationId) {
      set(st => ({ citations: st.citations.map(c => c.id === citationId ? { ...c, status: 'bound', span } : c) }));
    } else {
      set(st => ({
        citations: [...st.citations, { id: nextId('cite'), label: `Quote — "${span.text.slice(0, 24)}…"`, note: 'Show-note quote bound from transcript span.', status: 'bound', span }],
      }));
    }
    set({ tokenSel: null });
    material(get(), 'bind-span', `Bound span "${span.text.slice(0, 32)}" [${span.startMs}–${span.endMs} ms] to show notes`);
    s.addToast('success', 'Span bound to show-note citation.');
    return { ok: true };
  },

  fixCitation: (id) => {
    const s = get();
    const dlg = s.instances.find(i => i.lane === 'dialogue');
    if (!dlg) { s.addToast('error', 'Add a dialogue clip before binding the citation.'); return; }
    const toks = tokensOfSource(dlg.sourceId).filter(t => t.start >= dlg.sourceStart && t.end <= dlg.sourceEnd).slice(0, 4);
    if (!toks.length) { s.addToast('error', 'No transcript tokens inside the clip range.'); return; }
    const span = { sourceId: dlg.sourceId, startMs: toks[0].start, endMs: toks[toks.length - 1].end, text: toks.map(t => t.text).join(' ') };
    set(st => ({ citations: st.citations.map(c => c.id === id ? { ...c, status: 'bound', span } : c) }));
    material(get(), 'fix-citation', `Citation ${id} bound to ${dlg.sourceId} [${span.startMs}–${span.endMs} ms]`);
    s.addToast('success', 'Citation bound to a transcript span.');
  },

  updateChapter: (id, patch) => {
    set(s => ({ chapters: s.chapters.map(c => c.id === id ? { ...c, ...patch } : c) }));
    material(get(), 'chapter-edit', `Chapter ${id} updated`);
  },

  requestReorder: (id, dir) => {
    const s = get();
    const idx = s.chapters.findIndex(c => c.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= s.chapters.length) return;
    const order = [...s.chapters];
    const [blk] = order.splice(idx, 1);
    order.splice(j, 0, blk);
    // recompute contiguous times preserving durations — no overlap, full coverage
    let t = 0;
    const next = order.map(c => {
      const dur = c.end - c.start;
      const nc = { ...c, start: t, end: t + dur };
      t += dur;
      return nc;
    });
    const moved = next
      .map(nc => {
        const oc = s.chapters.find(c => c.id === nc.id)!;
        return { title: nc.title, from: [oc.start, oc.end] as [number, number], to: [nc.start, nc.end] as [number, number] };
      })
      .filter(m => m.from[0] !== m.to[0]);
    set({ reorderPreview: { id, dir, next, moved } });
  },

  confirmReorder: () => {
    const s = get();
    const rp = s.reorderPreview;
    if (!rp) return;
    // move clip groups: instances whose start falls in a moved chapter's old range shift by the delta
    const oldByid = Object.fromEntries(s.chapters.map(c => [c.id, c]));
    const instances = s.instances.map(i => {
      const owner = s.chapters.find(c => i.start >= c.start && i.start < c.end);
      if (!owner) return i;
      const nc = rp.next.find(c => c.id === owner.id)!;
      const d = nc.start - oldByid[owner.id].start;
      return d === 0 ? i : { ...i, start: i.start + d, end: i.end + d };
    });
    set({ chapters: rp.next, instances, reorderPreview: null });
    material(get(), 'chapter-reorder', `Blocks reordered under ripple preview — ${rp.moved.length} block(s) and their clip groups shifted`);
    s.addToast('success', 'Blocks reordered; clip groups rippled with them.');
  },

  cancelReorder: () => set({ reorderPreview: null }),

  setAutomationPoint: (lane, pointId, t, v) => {
    const s = get();
    const tt = Math.min(Math.max(0, Math.round(t / 10) * 10), 300000);
    const vv = Math.min(Math.max(-40, Math.round(v * 10) / 10), 0);
    set(st => ({
      automation: {
        ...st.automation,
        [lane]: (st.automation[lane] ?? []).map(p => p.id === pointId ? { ...p, t: tt, v: vv } : p).sort((a, b) => a.t - b.t),
      },
    }));
    material(get(), 'automation', `${lane} automation point moved to ${tt} ms / ${vv} dB`);
  },

  addAutomationPoint: (lane) => {
    const s = get();
    const pts = s.automation[lane] ?? [];
    const id = nextId('ap');
    const t = pts.length ? Math.round((pts[0].t + pts[pts.length - 1].t) / 2 / 10) * 10 : 150000;
    const v = lerpAutomation(pts, t);
    set(st => ({ automation: { ...st.automation, [lane]: [...pts, { id, t, v }].sort((a, b) => a.t - b.t) } }));
    material(get(), 'automation', `Added ${lane} automation point at ${t} ms / ${v} dB`);
  },

  deleteAutomationPoint: (lane, pointId) => {
    const s = get();
    if ((s.automation[lane] ?? []).length <= 2) { s.addToast('error', 'A lane keeps at least two automation points.'); return; }
    set(st => ({ automation: { ...st.automation, [lane]: st.automation[lane].filter(p => p.id !== pointId) } }));
    material(get(), 'automation', `Removed a ${lane} automation point`);
  },

  setRights: (sourceId, patch) => {
    set(s => ({ sources: s.sources.map(src => src.id === sourceId ? { ...src, ...patch } : src) }));
    material(get(), 'rights-edit', `Rights record updated for ${sourceId}`);
  },

  setNotes: (n) => {
    set({ notes: n });
    material(get(), 'notes', 'Show notes updated');
  },

  approvalBlockers: (cat) => {
    const s = get();
    const blockers: string[] = [];
    const included = new Set(s.instances.map(i => i.sourceId));
    if (cat === 'transcript') {
      s.citations.filter(c => c.status === 'orphan').forEach(c => blockers.push(`Citation "${c.label}" is orphaned — bind it to a transcript span.`));
      s.tokens.filter(t => t.text === 'evning' && !s.tokenState[t.id]?.correction && included.has(t.sourceId))
        .forEach(t => blockers.push(`Token "${t.text}" in ${t.sourceId} is a known fixture error — correct it with provenance.`));
    }
    if (cat === 'editorial') {
      const end = episodeEnd(s.instances);
      const sorted = [...s.chapters].sort((a, b) => a.start - b.start);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].end > sorted[i + 1].start) blockers.push(`Chapters "${sorted[i].title}" and "${sorted[i + 1].title}" overlap.`);
      }
      if (sorted.length && (sorted[0].start > 0 || sorted[sorted.length - 1].end < end)) {
        blockers.push('Chapters must cover the full approved timeline.');
      }
      s.citations.filter(c => c.status === 'orphan').forEach(c => blockers.push(`Orphaned citation "${c.label}" blocks editorial approval.`));
    }
    if (cat === 'rights') {
      s.instances.forEach(i => {
        const src = s.sources.find(x => x.id === i.sourceId)!;
        if (src.rightsState === 'forbidden') blockers.push(`${src.name} on the timeline has forbidden rights — remove it or clear the record.`);
      });
      [...included].forEach(sid => {
        const src = s.sources.find(x => x.id === sid)!;
        if (!src.attribution.trim()) blockers.push(`${src.name} is missing attribution text — add it in Rights Review.`);
        if (!src.allowedUsage.trim()) blockers.push(`${src.name} is missing allowed usage.`);
        if (!src.territory.trim()) blockers.push(`${src.name} is missing a territory fixture.`);
        if (src.expiryDaysAfterPublish <= 0) blockers.push(`${src.name} expiry must extend past the publish date (${PUBLISH_DATE}).`);
      });
    }
    if (cat === 'accessibility') {
      s.instances.filter(i => i.lane === 'dialogue' && !i.mute).forEach(i => {
        const toks = tokensOfSource(i.sourceId).filter(t => t.start >= i.sourceStart && t.end <= i.sourceEnd);
        if (toks.length && !toks.some(t => s.tokenState[t.id]?.included)) {
          blockers.push(`Clip instance ${i.id} has every caption token excluded — captions would be incomplete.`);
        }
      });
    }
    if (cat === 'master') {
      APPROVAL_CATS.filter(c => c !== 'master').forEach(c => {
        if (s.approvals[c].status !== 'approved') blockers.push(`${c} approval must be granted (currently ${s.approvals[c].status}).`);
      });
    }
    return blockers;
  },

  approveCategory: (cat) => {
    const s = get();
    const blockers = s.approvalBlockers(cat);
    if (blockers.length) {
      s.addToast('error', `${cat} approval blocked: ${blockers[0]}`);
      s.log('approve-blocked', `${cat}: ${blockers[0]}`);
      return { ok: false, blockers };
    }
    const cs = cutChecksum(s);
    set(st => ({ approvals: { ...st.approvals, [cat]: { status: 'approved', checksum: cs } } }));
    get().log('approve', `${cat} approval frozen at cut checksum ${cs}`);
    s.addToast('success', `${cat} approved — checksum ${cs} frozen.`);
    return { ok: true };
  },

  markStale: (action) => {
    const s = get();
    const cs = cutChecksum(s);
    const stale: string[] = [];
    const approvals = { ...s.approvals };
    APPROVAL_CATS.forEach(cat => {
      const a = approvals[cat];
      if (a.status === 'approved' && a.checksum !== cs) {
        approvals[cat] = { ...a, status: 'stale', staleReason: `${action} changed the cut checksum ${a.checksum} → ${cs}` };
        stale.push(cat);
      }
    });
    if (stale.length) {
      set({ approvals });
      get().addToast('info', `Material edit (${action}) marked ${stale.join(', ')} approval${stale.length > 1 ? 's' : ''} stale — checksum drifted to ${cs}.`);
    }
  },

  startRender: () => {
    const s = get();
    const notApproved = APPROVAL_CATS.filter(c => s.approvals[c].status !== 'approved');
    if (notApproved.length) {
      const error = `Render blocked: ${notApproved.join(', ')} approval${notApproved.length > 1 ? 's are' : ' is'} not granted.`;
      set(st => ({ renderPipeline: { ...st.renderPipeline, blockedReason: error } }));
      s.addToast('error', error);
      s.log('render-blocked', error);
      return { ok: false, error };
    }
    const first = s.renderPipeline.attempts.length === 0;
    const outputs: RenderPipeline['outputs'] = first
      ? { master: 'success', transcriptTimestamps: 'failed', chapterMarks: 'success', artworkManifest: 'success', rssEnclosure: 'failed' }
      : { master: 'success', transcriptTimestamps: 'success', chapterMarks: 'success', artworkManifest: 'success', rssEnclosure: 'success' };
    const results = Object.fromEntries(OUTPUT_KEYS.map(k => [k, outputs[k] as 'failed' | 'success'])) as Record<OutputKey, 'failed' | 'success' | 'preserved'>;
    set(st => ({
      renderPipeline: {
        status: first ? 'failed' : 'success',
        attempts: [...st.renderPipeline.attempts, { n: st.renderPipeline.attempts.length + 1, kind: 'full', results }],
        outputs,
        blockedReason: undefined,
      },
    }));
    get().log('render', first
      ? 'Render attempt 1: transcript timestamps and RSS enclosure failed deterministic checks; master, chapter marks, artwork manifest succeeded'
      : 'Render attempt: all outputs succeeded');
    s.addToast(first ? 'error' : 'success', first
      ? 'Render attempt 1 failed: transcript timestamp check and RSS enclosure check rejected. Successful outputs preserved.'
      : 'Render complete: all outputs succeeded.');
    return { ok: true };
  },

  retryFailed: () => {
    const s = get();
    if (s.renderPipeline.status !== 'failed') {
      const error = 'Retry failed-only requires a failed render batch.';
      s.addToast('error', error);
      return { ok: false, error };
    }
    const outputs = { ...s.renderPipeline.outputs };
    const results: Record<OutputKey, 'failed' | 'success' | 'preserved'> = {} as any;
    OUTPUT_KEYS.forEach(k => {
      if (outputs[k] === 'failed') { outputs[k] = 'success'; results[k] = 'success'; }
      else results[k] = 'preserved';
    });
    set(st => ({
      renderPipeline: {
        status: 'success',
        attempts: [...st.renderPipeline.attempts, { n: st.renderPipeline.attempts.length + 1, kind: 'failed-only', results }],
        outputs,
      },
    }));
    get().log('render-retry', 'Retry failed-only: transcript timestamps and RSS enclosure re-rendered; successful outputs preserved untouched');
    s.addToast('success', 'Retry failed-only complete: failed outputs re-rendered, successful outputs preserved.');
    return { ok: true };
  },

  branchCut: (name) => {
    const s = get();
    const forkName = name ?? `fork-${Object.keys(s.forks).length + 1}`;
    if (forkName === s.branch) return;
    set(st => ({
      forks: { ...st.forks, [st.branch]: takeSnapshot(st as unknown as AppState) },
      branch: forkName,
      mergeChoices: {},
    }));
    get().log('branch', `Forked cut "${forkName}" from ${s.branch} — full state carried over for comparison`);
    s.addToast('success', `Now editing branch "${forkName}" — the ${s.branch} cut is snapshotted for comparison.`);
  },

  switchBranch: (name) => {
    const s = get();
    const snap = s.forks[name];
    if (!snap) return;
    set(st => ({
      forks: { ...st.forks, [st.branch]: takeSnapshot(st as unknown as AppState) },
      branch: name,
      instances: snap.instances,
      tokenState: snap.tokenState,
      citations: snap.citations,
      chapters: snap.chapters,
      automation: snap.automation,
      notes: snap.notes,
      sources: st.sources.map(src => ({ ...src, ...snap.rights[src.id] })),
    }));
    get().log('branch-switch', `Switched to branch "${name}" with its saved cut state`);
  },

  setMergeChoice: (category, pick) => set(s => ({ mergeChoices: { ...s.mergeChoices, [category]: pick } })),

  applyMerge: () => {
    const s = get();
    const main = s.forks['main'];
    if (!main || s.branch === 'main') { s.addToast('error', 'Merge runs from a fork back into main.'); return; }
    const pick = (cat: string) => s.mergeChoices[cat] ?? 'fork';
    const merged: CutSnapshot = {
      instances: pick('clips') === 'fork' ? s.instances : main.instances,
      tokenState: pick('transcript') === 'fork' ? s.tokenState : main.tokenState,
      citations: pick('transcript') === 'fork' ? s.citations : main.citations,
      chapters: pick('chapters') === 'fork' ? s.chapters : main.chapters,
      automation: pick('mix') === 'fork' ? s.automation : main.automation,
      notes: pick('notes') === 'fork' ? s.notes : main.notes,
      rights: pick('rights') === 'fork'
        ? Object.fromEntries(s.sources.map(src => [src.id, { allowedUsage: src.allowedUsage, territory: src.territory, attribution: src.attribution, expiryDaysAfterPublish: src.expiryDaysAfterPublish, rightsState: src.rightsState }]))
        : main.rights,
    };
    set(st => ({
      branch: 'main',
      instances: merged.instances,
      tokenState: merged.tokenState,
      citations: merged.citations,
      chapters: merged.chapters,
      automation: merged.automation,
      notes: merged.notes,
      sources: st.sources.map(src => ({ ...src, ...merged.rights[src.id] })),
      forks: Object.fromEntries(Object.entries(st.forks).filter(([k]) => k !== 'main')),
      mergeChoices: {},
    }));
    material(get(), 'merge', `Merged branch into main with per-category conflict picks`);
    s.addToast('success', 'Merge applied — conflicts resolved per category, back on main.');
  },

  generateExport: () => {
    const s = get();
    const built = buildArtifacts(s);
    const prev = s.lastCompanions;
    const companions = Object.fromEntries(Object.entries(built).filter(([k]) => k !== 'canonical-json'));
    const identical = prev ? JSON.stringify(prev) === JSON.stringify(companions) : null;
    set({ exportOutputs: built, lastCompanions: companions as Record<string, string>, companionsIdentical: identical });
    get().log('export', identical === null
      ? 'Exported canonical JSON + CSV/VTT/RSS/Markdown/SVG companions'
      : `Re-exported: companions byte-identical=${identical}; only exportedAt changed in canonical JSON`);
  },

  importData: (data) => {
    const s = get();
    const errors: string[] = [];
    let parsed: any;
    try { parsed = JSON.parse(data); } catch { errors.push('document: not valid JSON'); }
    if (parsed) {
      if (parsed.schemaVersion !== 'podcast-episode-package/v1') errors.push(`schemaVersion: expected "podcast-episode-package/v1", got ${JSON.stringify(parsed.schemaVersion)}`);
      if (!Array.isArray(parsed.instances)) errors.push('instances: must be an array');
      else parsed.instances.forEach((i: any, idx: number) => {
        ['start', 'end', 'sourceStart', 'sourceEnd'].forEach(f => {
          if (!Number.isInteger(i?.[f])) errors.push(`instances[${idx}].${f}: must be an integer millisecond value`);
        });
        if (typeof i?.lane !== 'string' || !LANES.includes(i.lane)) errors.push(`instances[${idx}].lane: unknown lane ${JSON.stringify(i?.lane)}`);
      });
      if (!Array.isArray(parsed.chapters)) errors.push('chapters: must be an array');
      if (parsed.tokenState && typeof parsed.tokenState !== 'object') errors.push('tokenState: must be an object');
      if (parsed.automation && typeof parsed.automation !== 'object') errors.push('automation: must be an object');
    }
    if (errors.length) {
      set({ importError: errors });
      s.addToast('error', `Import rejected — ${errors.length} invalid field${errors.length > 1 ? 's' : ''} (state unchanged).`);
      s.log('import-rejected', errors.join('; '));
      return { ok: false, errors };
    }
    set({
      importError: null,
      instances: parsed.instances,
      chapters: parsed.chapters,
      citations: parsed.citations ?? [],
      tokenState: parsed.tokenState ?? initialTokenState(),
      automation: parsed.automation ?? INITIAL_AUTOMATION,
      notes: typeof parsed.notes === 'string' ? parsed.notes : get().notes,
      branch: typeof parsed.branch === 'string' ? parsed.branch : get().branch,
    });
    if (parsed.rights && typeof parsed.rights === 'object') {
      set(st => ({ sources: st.sources.map(src => parsed.rights[src.id] ? { ...src, ...parsed.rights[src.id] } : src) }));
    }
    material(get(), 'import', 'Canonical JSON imported — cut state reconstructed exactly');
    s.addToast('success', 'Import complete: cut state reconstructed from canonical JSON.');
    return { ok: true };
  },

  resetAll: () => {
    set({
      sources: FIXTURES.sources,
      tokenState: initialTokenState(),
      instances: INITIAL_INSTANCES,
      chapters: INITIAL_CHAPTERS,
      citations: INITIAL_CITATIONS,
      automation: INITIAL_AUTOMATION,
      approvals: INITIAL_APPROVALS(),
      renderPipeline: INITIAL_RENDER(),
      branch: 'main',
      forks: {},
      notes: 'Night Market Economies — how a street economy rebuilt itself one lantern at a time.',
      laneFlags: { dialogue: { mute: false, solo: false }, crosstalk: { mute: false, solo: false }, music: { mute: false, solo: false }, ambient: { mute: false, solo: false }, marker: { mute: false, solo: false } },
      selectedInstance: null,
      tokenSel: null,
      insertError: null,
      reorderPreview: null,
      mergeChoices: {},
      importError: null,
      exportOutputs: {},
      lastCompanions: null,
      companionsIdentical: null,
      undoStack: [],
    });
    get().log('reset', 'Workspace reset to the deterministic starter fixtures');
    get().addToast('info', 'Workspace reset to starter fixtures.');
  },
}));
