import { create } from 'zustand';

export type LaneType = 'dialogue' | 'music' | 'ambient' | 'marker' | 'crosstalk';

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
  expiryAfterPublish: string;
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
  mute?: boolean;
  included?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  role: string;
  start: number;
  end: number;
  speakers: string[];
  summary: string;
}

export interface Approvals {
  transcript: { status: 'approved' | 'unapproved' | 'stale'; checksum: string };
  editorial: { status: 'approved' | 'unapproved' | 'stale'; checksum: string };
  rights: { status: 'approved' | 'unapproved' | 'stale'; checksum: string };
  accessibility: { status: 'approved' | 'unapproved' | 'stale'; checksum: string };
  master: { status: 'approved' | 'unapproved' | 'stale'; checksum: string };
}

export interface RenderPipeline {
  status: 'idle' | 'failed' | 'success';
  attempts: number;
  outputs: {
    transcriptTimestamp: 'pending' | 'failed' | 'success';
    rssEnclosure: 'pending' | 'failed' | 'success';
    audioMaster: 'pending' | 'failed' | 'success';
  };
}

export interface WebMCPState {
  sources: Source[];
  instances: Instance[];
  chapters: Chapter[];
  approvals: Approvals;
  renderPipeline: RenderPipeline;
  branch: string;
  citations: Record<string, string>;
  mix: Record<string, number>;
  forks: Record<string, Omit<WebMCPState, 'forks'>>;
  exportDataOutputs: Record<string, string>;
}

const INITIAL_SOURCES: Source[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `source-${i + 1}`,
  name: `Clip ${i + 1}`,
  speaker: `Speaker ${(i % 3) + 1}`,
  type: i < 20 ? 'dialogue' : i < 22 ? 'music' : 'ambient',
  duration: 15000 + i * 1000,
  transcriptSnippet: `This is a transcript token for clip ${i + 1}.`,
  rightsState: i === 5 ? 'forbidden' : 'allowed',
  mediaHash: `hash-${i + 1}-${Math.random().toString(36).substring(7)}`,
  allowedUsage: 'Podcast, Web',
  territory: 'Worldwide',
  attribution: `Attribution for Clip ${i + 1}`,
  expiryAfterPublish: '2099-12-31'
}));

const INITIAL_CHAPTERS: Chapter[] = [
  { id: 'chap-1', title: 'Cold Open', role: 'intro', start: 0, end: 60000, speakers: ['Speaker 1'], summary: 'Teaser' },
  { id: 'chap-2', title: 'Introduction', role: 'host-intro', start: 60000, end: 120000, speakers: ['Speaker 1'], summary: 'Intro' },
  { id: 'chap-3', title: 'Chapter 1', role: 'content', start: 120000, end: 200000, speakers: ['Speaker 2'], summary: 'Part 1' },
  { id: 'chap-4', title: 'Chapter 2', role: 'content', start: 200000, end: 250000, speakers: ['Speaker 1', 'Speaker 2'], summary: 'Part 2' },
  { id: 'chap-5', title: 'Chapter 3', role: 'content', start: 250000, end: 300000, speakers: ['Speaker 3'], summary: 'Part 3' },
  { id: 'chap-6', title: 'Transition', role: 'bumper', start: 300000, end: 310000, speakers: [], summary: 'Music' },
  { id: 'chap-7', title: 'Credits', role: 'outro', start: 310000, end: 350000, speakers: ['Speaker 1'], summary: 'End' }
];

const computeChecksum = (state: Partial<WebMCPState>) => {
  return btoa(JSON.stringify({
    instances: state.instances,
    chapters: state.chapters,
    mix: state.mix,
    citations: state.citations
  })).substring(0, 10);
};

const INITIAL_APPROVALS: Approvals = {
  transcript: { status: 'unapproved', checksum: '' },
  editorial: { status: 'unapproved', checksum: '' },
  rights: { status: 'unapproved', checksum: '' },
  accessibility: { status: 'unapproved', checksum: '' },
  master: { status: 'unapproved', checksum: '' },
};

export const useStore = create<WebMCPState & {
  insertInstance: (sourceId: string, lane: LaneType, start: number) => void;
  updateInstance: (id: string, updates: Partial<Instance>) => void;
  deleteInstance: (id: string) => void;
  splitInstance: (id: string, splitAt: number) => void;
  rippleMove: (id: string, offset: number) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  reorderChapters: (id: string, offset: number) => void;
  fixCitation: (id: string) => void;
  updateMix: (id: string, val: number) => void;
  approveCategory: (category: keyof Approvals) => void;
  render: () => void;
  retryRender: () => void;
  branchCut: (name: string) => void;
  mergeCut: () => void;
  generateExportOutputs: () => void;
  importData: (data: string) => void;
  markStale: () => void;
}>((set, get) => ({
  sources: INITIAL_SOURCES,
  instances: [
    { id: 'inst-1', sourceId: 'source-1', lane: 'dialogue', start: 0, end: 10000, sourceStart: 0, sourceEnd: 10000, fade: 0, mute: false, crossfade: false },
    { id: 'inst-forbidden', sourceId: 'source-6', lane: 'dialogue', start: 10000, end: 20000, sourceStart: 0, sourceEnd: 10000, fade: 0, mute: false, crossfade: false }
  ],
  chapters: INITIAL_CHAPTERS,
  approvals: INITIAL_APPROVALS,
  renderPipeline: { status: 'idle', attempts: 0, outputs: { transcriptTimestamp: 'pending', rssEnclosure: 'pending', audioMaster: 'pending' } },
  branch: 'main',
  citations: { 'cite-1': 'orphan' },
  mix: { 'loudness': -15 },
  forks: {},
  exportDataOutputs: {},

  markStale: () => set(state => {
    const cs = computeChecksum(state);
    const newApprovals = { ...state.approvals };
    let changed = false;
    (Object.keys(newApprovals) as (keyof Approvals)[]).forEach(k => {
      if (newApprovals[k].status === 'approved' && newApprovals[k].checksum !== cs) {
        newApprovals[k] = { ...newApprovals[k], status: 'stale' };
        changed = true;
      }
    });
    if (changed) return { approvals: newApprovals };
    return state;
  }),

  insertInstance: (sourceId, lane, start) => set(state => {
    const s = { instances: [...state.instances, { id: `inst-${Date.now()}`, sourceId, lane, start, end: start + 10000, sourceStart: 0, sourceEnd: 10000, fade: 0, mute: false, crossfade: false }] };
    return s;
  }),

  updateInstance: (id, updates) => set(state => {
    return { instances: state.instances.map(inst => inst.id === id ? { ...inst, ...updates } : inst) };
  }),

  deleteInstance: (id) => set(state => {
    return { instances: state.instances.filter(inst => inst.id !== id) };
  }),

  splitInstance: (id, splitAt) => set(state => {
    const inst = state.instances.find(i => i.id === id);
    if (!inst) return state;
    const newInst = { ...inst, id: `inst-${Date.now()}`, start: inst.start + splitAt, sourceStart: inst.sourceStart + splitAt };
    return {
      instances: [...state.instances.filter(i => i.id !== id), { ...inst, end: inst.start + splitAt, sourceEnd: inst.sourceStart + splitAt }, newInst]
    };
  }),

  rippleMove: (id, offset) => set(state => {
    const inst = state.instances.find(i => i.id === id);
    if (!inst) return state;
    return {
      instances: state.instances.map(i => i.start >= inst.start ? { ...i, start: i.start + offset, end: i.end + offset } : i)
    };
  }),

  updateChapter: (id, updates) => set(state => ({
    chapters: state.chapters.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  reorderChapters: (id, offset) => set(state => {
    const chapters = [...state.chapters];
    const idx = chapters.findIndex(c => c.id === id);
    if (idx < 0) return state;
    const targetIdx = idx + offset;
    if (targetIdx < 0 || targetIdx >= chapters.length) return state;
    const temp = chapters[idx];
    chapters[idx] = chapters[targetIdx];
    chapters[targetIdx] = temp;
    return { chapters };
  }),

  fixCitation: (id) => set(state => ({
    citations: { ...state.citations, [id]: 'bound' }
  })),

  updateMix: (id, val) => set(state => ({
    mix: { ...state.mix, [id]: val }
  })),

  approveCategory: (category) => set(state => {
    const cs = computeChecksum(state);

    // checks per category
    if (category === 'rights') {
      const hasForbidden = state.instances.some(i => state.sources.find(s => s.id === i.sourceId)?.rightsState === 'forbidden');
      if (hasForbidden) return state;
    }
    if (category === 'editorial') {
      const hasOrphan = Object.values(state.citations).includes('orphan');
      if (hasOrphan) return state;
    }

    return { approvals: { ...state.approvals, [category]: { status: 'approved', checksum: cs } } };
  }),

  render: () => set(state => {
    const allApproved = Object.values(state.approvals).every(a => a.status === 'approved');
    if (!allApproved) return { renderPipeline: { ...state.renderPipeline, status: 'failed' } };

    // first batch fails deterministically
    if (state.renderPipeline.attempts === 0) {
      return {
        renderPipeline: {
          status: 'failed',
          attempts: 1,
          outputs: { transcriptTimestamp: 'failed', rssEnclosure: 'failed', audioMaster: 'success' }
        }
      };
    }

    return {
      renderPipeline: {
        status: 'success',
        attempts: state.renderPipeline.attempts + 1,
        outputs: { transcriptTimestamp: 'success', rssEnclosure: 'success', audioMaster: 'success' }
      }
    };
  }),

  retryRender: () => set(state => {
    if (state.renderPipeline.status !== 'failed') return state;
    const newOutputs = { ...state.renderPipeline.outputs };
    if (newOutputs.transcriptTimestamp === 'failed') newOutputs.transcriptTimestamp = 'success';
    if (newOutputs.rssEnclosure === 'failed') newOutputs.rssEnclosure = 'success';
    return {
      renderPipeline: {
        status: 'success',
        attempts: state.renderPipeline.attempts + 1,
        outputs: newOutputs
      }
    };
  }),

  branchCut: (name) => set(state => {
    if (state.branch === name) return state;
    const snapshot = {
      sources: state.sources,
      instances: state.instances,
      chapters: state.chapters,
      approvals: state.approvals,
      renderPipeline: state.renderPipeline,
      branch: state.branch,
      citations: state.citations,
      mix: state.mix,
      exportDataOutputs: state.exportDataOutputs
    };
    return {
      branch: name,
      forks: { ...state.forks, [state.branch]: snapshot }
    };
  }),

  mergeCut: () => set(state => {
    if (state.branch === 'main') return state;
    return { branch: 'main' };
  }),

  generateExportOutputs: () => set(state => {
    const json = JSON.stringify({
      schemaVersion: "podcast-episode-package/v1",
      exportedAt: new Date().toISOString(),
      instances: state.instances,
      chapters: state.chapters,
      citations: state.citations,
      mix: state.mix,
      renderStatus: state.renderPipeline.status
    });

    const csv = `id,sourceId,lane,start,end\n${state.instances.map(i => `${i.id},${i.sourceId},${i.lane},${i.start},${i.end}`).join('\n')}`;
    const vtt = `WEBVTT\n\n00:00.000 --> 00:10.000\nTranscript output...`;
    const rss = `<rss version="2.0"><channel><item><title>Episode</title></item></channel></rss>`;
    const md = `# Show Notes\n\n* Chapters: ${state.chapters.length}\n* Credits: Included`;
    const svg = `<svg width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="blue" /></svg>`;

    return {
      exportDataOutputs: { json, csv, vtt, rss, md, svg }
    };
  }),

  importData: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.schemaVersion === "podcast-episode-package/v1") {
        set({
          instances: parsed.instances,
          chapters: parsed.chapters,
          citations: parsed.citations,
          mix: parsed.mix
        });
      }
    } catch (e) {
      console.error("Invalid import", e);
    }
  }
}));

// Subscribe to state changes to mark approvals stale
useStore.subscribe((state, prevState) => {
  if (state.instances !== prevState.instances ||
      state.chapters !== prevState.chapters ||
      state.citations !== prevState.citations ||
      state.mix !== prevState.mix) {
    state.markStale();
  }
});
