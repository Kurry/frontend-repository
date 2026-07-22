import { create } from 'zustand';

export type LaneType = 'dialogue' | 'music' | 'ambient' | 'marker';

export interface Source {
  id: string;
  name: string;
  speaker: string;
  type: LaneType;
  duration: number;
  transcriptSnippet: string;
  rightsState: 'allowed' | 'forbidden';
  mediaHash: string;
}

export interface Instance {
  id: string;
  sourceId: string;
  lane: LaneType;
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
  fade?: number;
  crossfade?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

export interface WebMCPState {
  sources: Source[];
  instances: Instance[];
  chapters: Chapter[];
  rights: { approved: boolean; stale: boolean };
  renderStatus: 'idle' | 'failed' | 'success';
  branch: string;
  citations: Record<string, string>;
  mix: Record<string, number>;
}

const INITIAL_SOURCES: Source[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `source-${i + 1}`,
  name: `Clip ${i + 1}`,
  speaker: `Speaker ${(i % 3) + 1}`,
  type: i < 20 ? 'dialogue' : i < 22 ? 'music' : 'ambient',
  duration: 15000 + i * 1000,
  transcriptSnippet: `This is a transcript for clip ${i + 1}.`,
  rightsState: i === 5 ? 'forbidden' : 'allowed',
  mediaHash: `hash-${i + 1}`
}));

const INITIAL_CHAPTERS: Chapter[] = [
  { id: 'chap-1', title: 'Cold Open', start: 0, end: 60000 },
  { id: 'chap-2', title: 'Introduction', start: 60000, end: 120000 },
  { id: 'chap-3', title: 'Chapter 1', start: 120000, end: 300000 },
];

export const useStore = create<WebMCPState & {
  insertInstance: (sourceId: string, lane: LaneType, start: number) => void;
  updateInstance: (id: string, updates: Partial<Instance>) => void;
  deleteInstance: (id: string) => void;
  splitInstance: (id: string, splitAt: number) => void;
  rippleMove: (id: string, offset: number) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  fixCitation: (id: string) => void;
  updateMix: (id: string, val: number) => void;
  approve: () => void;
  render: () => void;
  branchCut: (name: string) => void;
  mergeCut: () => void;
  exportData: () => string;
  importData: (data: string) => void;
}>((set, get) => ({
  sources: INITIAL_SOURCES,
  instances: [
    { id: 'inst-1', sourceId: 'source-1', lane: 'dialogue', start: 0, end: 10000, sourceStart: 0, sourceEnd: 10000 },
    { id: 'inst-forbidden', sourceId: 'source-6', lane: 'dialogue', start: 10000, end: 20000, sourceStart: 0, sourceEnd: 10000 }
  ],
  chapters: INITIAL_CHAPTERS,
  rights: { approved: false, stale: true },
  renderStatus: 'idle',
  branch: 'main',
  citations: { 'cite-1': 'orphan' },
  mix: { 'loudness': -15 },

  insertInstance: (sourceId, lane, start) => set(state => ({
    instances: [...state.instances, {
      id: `inst-${Date.now()}`, sourceId, lane, start, end: start + 10000, sourceStart: 0, sourceEnd: 10000
    }],
    rights: { ...state.rights, stale: true }
  })),

  updateInstance: (id, updates) => set(state => ({
    instances: state.instances.map(inst => inst.id === id ? { ...inst, ...updates } : inst),
    rights: { ...state.rights, stale: true }
  })),

  deleteInstance: (id) => set(state => ({
    instances: state.instances.filter(inst => inst.id !== id),
    rights: { ...state.rights, stale: true }
  })),

  splitInstance: (id, splitAt) => set(state => {
    const inst = state.instances.find(i => i.id === id);
    if (!inst) return state;
    const newInst = { ...inst, id: `inst-${Date.now()}`, start: inst.start + splitAt, sourceStart: inst.sourceStart + splitAt };
    return {
      instances: [...state.instances.filter(i => i.id !== id), { ...inst, end: inst.start + splitAt, sourceEnd: inst.sourceStart + splitAt }, newInst],
      rights: { ...state.rights, stale: true }
    };
  }),

  rippleMove: (id, offset) => set(state => {
    const inst = state.instances.find(i => i.id === id);
    if (!inst) return state;
    const newStart = inst.start + offset;
    return {
      instances: state.instances.map(i => i.start >= inst.start ? { ...i, start: i.start + offset, end: i.end + offset } : i),
      rights: { ...state.rights, stale: true }
    };
  }),

  updateChapter: (id, updates) => set(state => ({
    chapters: state.chapters.map(c => c.id === id ? { ...c, ...updates } : c),
    rights: { ...state.rights, stale: true }
  })),

  fixCitation: (id) => set(state => ({
    citations: { ...state.citations, [id]: 'bound' },
    rights: { ...state.rights, stale: true }
  })),

  updateMix: (id, val) => set(state => ({
    mix: { ...state.mix, [id]: val },
    rights: { ...state.rights, stale: true }
  })),

  approve: () => set(state => {
    const hasForbidden = state.instances.some(i => state.sources.find(s => s.id === i.sourceId)?.rightsState === 'forbidden');
    const hasOrphan = Object.values(state.citations).includes('orphan');
    const hasJump = state.mix.loudness > -10;
    if (hasForbidden || hasOrphan || hasJump) return state;
    return { rights: { approved: true, stale: false } };
  }),

  render: () => set(state => {
    if (!state.rights.approved || state.rights.stale) return state;
    if (state.renderStatus === 'idle') return { renderStatus: 'failed' };
    return { renderStatus: 'success' };
  }),

  branchCut: (name) => set({ branch: name }),
  mergeCut: () => set({ branch: 'main' }),

  exportData: () => {
    const state = get();
    return JSON.stringify({
      schemaVersion: "podcast-episode-package/v1",
      exportedAt: new Date().toISOString(),
      instances: state.instances,
      chapters: state.chapters,
      citations: state.citations,
      mix: state.mix,
      renderStatus: state.renderStatus
    });
  },

  importData: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.schemaVersion === "podcast-episode-package/v1") {
        set({
          instances: parsed.instances,
          chapters: parsed.chapters,
          citations: parsed.citations,
          mix: parsed.mix,
          renderStatus: parsed.renderStatus
        });
      }
    } catch (e) {
      console.error("Invalid import", e);
    }
  }
}));
