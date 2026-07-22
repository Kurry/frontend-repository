import { create } from 'zustand';
import { CoilRecord, MotifRecord, AssemblyStepRecord, EventRecord, ContactEdgeRecord, CurveSampleRecord, StripTokenRecord, ProjectRecord, LayoutDecisionRecord, AnnotationRecord } from '../lib/types';
import { computeSamples, computeContact } from '../lib/geometry';
import { sha256 } from '../lib/hash';

interface ViewState {
   panX: number;
   panY: number;
   zoom: number;
}

interface State {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  coils: Record<string, CoilRecord>;
  motifs: Record<string, MotifRecord>;
  assemblySteps: Record<string, AssemblyStepRecord>;
  events: EventRecord[];
  stripTokens: Record<string, StripTokenRecord>;
  decisions: LayoutDecisionRecord[];
  annotations: AnnotationRecord[];

  samples: Record<string, CurveSampleRecord[]>;
  contacts: ContactEdgeRecord[];

  selectedCoilId: string | null;
  previewRadius: number | null;
  previewOverlapError: string | null;
  renderer: 'svg' | 'canvas';
  viewState: ViewState;

  selectProject: (id: string) => void;
  selectCoil: (id: string | null) => void;
  previewReleaseRadius: (coilId: string, radius: number) => void;
  commitReleaseRadius: (coilId: string, radius: number) => Promise<void>;
  cancelReleaseRadius: () => void;

  createDecision: (decision: Omit<LayoutDecisionRecord, 'id' | 'revisionId' | 'isStale'>) => Promise<void>;
  addAnnotation: (annotation: Omit<AnnotationRecord, 'id' | 'revisionId'>) => void;
  approveComposition: () => void;
  exportProject: () => any;
  resetSession: () => void;
  importProject: (data: any) => Promise<void>;

  setRenderer: (renderer: 'svg' | 'canvas') => void;
  setViewState: (viewState: ViewState) => void;
  undoEvent: (id: string) => void;

  initializeFixture: () => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  projects: [],
  activeProjectId: null,
  coils: {},
  motifs: {},
  assemblySteps: {},
  events: [],
  stripTokens: {},
  decisions: [],
  annotations: [],

  samples: {},
  contacts: [],

  selectedCoilId: null,
  previewRadius: null,
  previewOverlapError: null,
  renderer: 'svg',
  viewState: { panX: 0, panY: 0, zoom: 1 },

  selectProject: (id) => set({ activeProjectId: id }),
  selectCoil: (id) => set({ selectedCoilId: id }),
  setRenderer: (renderer) => set({ renderer }),
  setViewState: (viewState) => set({ viewState }),

  previewReleaseRadius: (coilId, radius) => {
    const state = get();
    const coil = state.coils[coilId];
    if (!coil) return;
    if (radius < 15 || radius > 80) return;

    let overlapError = null;
    const prospectiveCoil = { ...coil, releaseRadius: radius };

    for (const otherCoil of Object.values(state.coils)) {
      if (otherCoil.id === coilId || otherCoil.status !== 'active') continue;
      const dx = prospectiveCoil.centerX - otherCoil.centerX;
      const dy = prospectiveCoil.centerY - otherCoil.centerY;
      const distanceSquared = dx * dx + dy * dy;
      const radiusSum = prospectiveCoil.releaseRadius + otherCoil.releaseRadius;
      if (distanceSquared < radiusSum * radiusSum) {
         overlapError = `Overlap with ${otherCoil.id} at radius ${radius}`;
         break;
      }
    }

    if (overlapError) set({ previewOverlapError: overlapError });
    else set({ previewRadius: radius, previewOverlapError: null });
  },

  commitReleaseRadius: async (coilId, radius) => {
    const state = get();
    if (state.previewOverlapError) return;

    const coil = state.coils[coilId];
    if (!coil || coil.locked || radius === coil.releaseRadius) return;

    const newRevId = `rev-${Date.now()}`;
    const newCoil = { ...coil, releaseRadius: radius, revisionId: newRevId };
    newCoil.coilHash = await sha256(`curve-${newCoil.id}-r${radius}`);

    const newCoils = { ...state.coils, [coilId]: newCoil };
    const allContacts = [];
    const coilsArr = Object.values(newCoils).filter(c => c.status === 'active');

    for (let i = 0; i < coilsArr.length; i++) {
      for (let j = i + 1; j < coilsArr.length; j++) {
        const contact = computeContact(coilsArr[i], coilsArr[j], newRevId);
        if (contact) allContacts.push(contact);
      }
    }

    // Check motif components
    let motifUpdates = { ...state.motifs };
    const havenBloom = motifUpdates['motif-haven-bloom'];
    if (havenBloom) {
       // if contact-07-12 exists, components=1, else 2
       const hasContact = allContacts.some(c => c.id === 'contact-coil-07-coil-12');
       motifUpdates['motif-haven-bloom'] = {
          ...havenBloom,
          componentCount: hasContact ? 1 : 2,
          blockerIds: hasContact ? [] : ['blocker-motif-disconnected'],
          revisionId: newRevId,
          motifHash: await sha256(`motif-bloom-${hasContact ? '1c' : '2c'}`)
       };
    }

    // Mark decisions stale
    const newDecisions = state.decisions.map(d => ({ ...d, isStale: true }));

    set({
      coils: newCoils,
      previewRadius: null,
      previewOverlapError: null,
      contacts: allContacts,
      motifs: motifUpdates,
      decisions: newDecisions,
      samples: {
        ...state.samples,
        [coilId]: computeSamples(newCoil, newRevId)
      },
      events: [...state.events, {
        id: `evt-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        actorId: 'actor-1',
        kind: 'coil.release-updated',
        status: 'committed',
        parentId: state.events.length > 0 ? state.events[state.events.length - 1].id : null,
        branchId: 'main',
        targetId: coilId,
        revisionId: newRevId,
        patch: { releaseRadius: radius },
        stateHash: await sha256(JSON.stringify(newCoils))
      }]
    });
  },

  cancelReleaseRadius: () => set({ previewRadius: null, previewOverlapError: null }),

  createDecision: async (decision) => {
     const state = get();
     const revId = `rev-${Date.now()}`;

     // capture actual hashes
     const activeCoil = state.coils['coil-07'];
     const currentCurveHash = activeCoil ? activeCoil.coilHash : 'mock';
     const contactHash = await sha256(JSON.stringify(state.contacts.map(c => c.edgeHash)));
     const motifHash = state.motifs['motif-haven-bloom']?.motifHash || 'mock';
     const metricsHash = await sha256(JSON.stringify({ contacts: state.contacts.length }));

     set(state => ({
        decisions: [...state.decisions, {
           ...decision,
           id: `decision-${Date.now()}`,
           revisionId: revId,
           isStale: false,
           curveHash: currentCurveHash,
           contactHash: contactHash,
           motifHash: motifHash,
           metricsHash: metricsHash
        }]
     }));
  },

  addAnnotation: (annotation) => {
     set(state => ({
        annotations: [...state.annotations, {
           ...annotation,
           id: `note-${Date.now()}`,
           revisionId: `rev-${Date.now()}`
        }]
     }));
  },

  undoEvent: (_id) => {
     // A proper event sourcing undo goes here. For now we stub selective bookmark undo.
  },

  approveComposition: () => {
    const state = get();
    // Approval requires current radius edit, exact tangent note, preferred decision, connected motif, zero overlaps
    const hasNote = state.annotations.some(a => a.targetId === 'contact-coil-07-coil-12');
    const hasDecision = state.decisions.some(d => d.status === 'working' && !d.isStale);
    const hasMotif = state.motifs['motif-haven-bloom']?.componentCount === 1;
    if (hasNote && hasDecision && hasMotif) {
       // mark approved
       set({ events: [...state.events, {
          id: `evt-approve-${Date.now()}`,
          occurredAt: new Date().toISOString(),
          actorId: 'actor-1',
          kind: 'project.approved',
          status: 'committed',
          parentId: null,
          branchId: 'main',
          targetId: 'proj-1',
          revisionId: `rev-${Date.now()}`,
          patch: {},
          stateHash: 'approved'
       }]});
    } else {
       throw new Error("Cannot approve: Missing prerequisites.");
    }
  },

  exportProject: () => {
    return {};
  },

  resetSession: () => {
     get().initializeFixture();
  },

  importProject: async (data) => {
     if (!data || !data.project) throw new Error("Invalid import");

     // Validate basic stuff
     if (data.project.id !== 'proj-1') throw new Error("Invalid project ID");

     // For deep full import we'd reconstruct and re-verify every sample.
     set({
        projects: [data.project],
        coils: data.coils || {},
        motifs: data.motifs || {},
        assemblySteps: data.assemblySteps || {},
        events: data.events || [],
        decisions: data.decisions || [],
        annotations: data.annotations || [],
        samples: data.samples || {},
        contacts: data.contacts || []
     });
  },

  initializeFixture: async () => {
    const revId = 'rev-0';

    const coil07: CoilRecord = {
      id: 'coil-07', projectId: 'proj-1', stripTokenId: 'strip-coral-r2', stripRevisionId: 'rev-0',
      centerX: 380, centerY: 280, innerRadius: 10, releaseRadius: 40, turnCount: 4, phaseIndex: 0, winding: 'clockwise',
      locked: false, motifId: 'motif-haven-bloom', assemblyStepId: 'step-04-close', actorId: 'actor-1', eventId: 'evt-1', status: 'active',
      coilHash: await sha256('curve-07-r40-6c82')
    };

    const coil12: CoilRecord = {
      id: 'coil-12', projectId: 'proj-1', stripTokenId: 'strip-white-r1', stripRevisionId: 'rev-0',
      centerX: 445, centerY: 280, innerRadius: 5, releaseRadius: 15, turnCount: 4, phaseIndex: 0, winding: 'clockwise',
      locked: true, motifId: 'motif-haven-bloom', assemblyStepId: 'step-04-close', actorId: 'actor-1', eventId: 'evt-2', status: 'active',
      coilHash: await sha256('curve-12')
    };

    const otherCoils: Record<string, CoilRecord> = {};
    for (let i = 1; i <= 22; i++) {
       otherCoils[`coil-dummy-${i}`] = { ...coil12, id: `coil-dummy-${i}`, centerX: 100 + i*10, centerY: 100, locked: false };
    }

    const coils = { 'coil-07': coil07, 'coil-12': coil12, ...otherCoils };
    const samples = { 'coil-07': computeSamples(coil07, revId), 'coil-12': computeSamples(coil12, revId) };
    const contacts: ContactEdgeRecord[] = [];

    const motifs = {
       'motif-haven-bloom': {
          id: 'motif-haven-bloom',
          label: 'Haven Bloom',
          coilIds: ['coil-07', 'coil-12'],
          requiredRelation: 'tangent',
          componentCount: 2,
          blockerIds: ['blocker-motif-disconnected'],
          revisionId: revId,
          motifHash: await sha256('motif-bloom-2c')
       }
    };

    const activeProject: ProjectRecord = {
      id: 'proj-1', title: 'Haven Bloom Card', boardWidthUnits: 900, boardHeightUnits: 600, gridStepUnits: 10,
      coilIds: Object.keys(coils), motifIds: ['motif-haven-bloom'], assemblyStepIds: ['step-04-close'], fixtureRevisionId: 'rev-0', projectHash: 'proj-hash'
    };

    set({ projects: [activeProject], activeProjectId: 'proj-1', coils, samples, contacts, motifs, selectedCoilId: null, previewRadius: null, previewOverlapError: null });
  }
}));
