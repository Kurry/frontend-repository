import { create } from 'zustand';
import type {
  NegativeRecord, StripRecord, ExposurePassRecord, ZoneDecisionRecord,
  HistoryEvent, CalibrationSource, PaperProfile, MaskGeometry
} from './models';


export interface AppState {
  logicalClock: string;
  projectId: string;
  fixtureRevisionId: string;
  negative: NegativeRecord | null;
  strip: StripRecord | null;
  paperProfile: PaperProfile | null;
  calibrationSources: CalibrationSource[];
  passes: ExposurePassRecord[];
  decisions: ZoneDecisionRecord[];
  history: HistoryEvent[];
  historyAnchorId: string | null;

  // View State
  selectedPassId: string | null;
  selectedZoneId: string | null;
  brushRange: [number, number] | null;
  renderer: 'Canvas' | 'SVG';
  previewMode: 'negative' | 'paper' | 'split';

  // Transient Drag State
  dragPreviewPass: ExposurePassRecord | null;

  // Computed metrics
  cellExposures: Map<string, { passIds: string[], effectiveMilliDs: number, responseValue: number }>;
  zoneMetrics: Map<string, { targetError: number, highlightReserve: number, shadowSeparation: number, clippingCount: number, rank: number }>;

  // Actions
  initFixture: () => void;
  setCanvasViewport: (viewport: any) => void;
  setRenderer: (renderer: 'Canvas' | 'SVG') => void;
  setPreviewMode: (mode: 'negative' | 'paper' | 'split') => void;

  selectPass: (id: string | null) => void;
  previewMaskEdit: (passId: string, mask: MaskGeometry) => void;
  commitMaskEdit: (passId: string, mask: MaskGeometry) => void;
  cancelMaskEdit: () => void;

  selectZone: (id: string | null) => void;
  commitZoneDecision: (zoneId: string, rationale: string, sources: string[]) => void;

  previewRecipeRebase: (passId: string, newFactor: number) => void;
  commitRecipeRebase: (passId: string, newFactor: number) => void;

  computeExposures: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  logicalClock: "2042-03-12T19:00:00Z",
  projectId: "proj-01",
  fixtureRevisionId: "rev-01",
  negative: null,
  strip: null,
  paperProfile: null,
  calibrationSources: [],
  passes: [],
  decisions: [],
  history: [],
  historyAnchorId: null,

  selectedPassId: null,
  selectedZoneId: null,
  brushRange: null,
  renderer: 'Canvas',
  previewMode: 'paper',

  dragPreviewPass: null,

  cellExposures: new Map(),
  zoneMetrics: new Map(),

  initFixture: () => {
    // Generate synthetic negative 48x32
    const densityRows: number[][] = [];
    for(let r=0; r<32; r++){
      const row: number[] = [];
      for(let c=0; c<48; c++){
        row.push(Math.floor((c/48) * 63));
      }
      densityRows.push(row);
    }
    const negative: NegativeRecord = {
      id: "neg-01",
      title: "North Window 12",
      logicalWidth: 48,
      logicalHeight: 32,
      densityRows,
      sourceRevisionId: "rev-01",
      rasterHash: "hash-neg",
      notes: ""
    };

    // Generate strip
    const strip: StripRecord = {
      id: "strip-01",
      negativeId: "neg-01",
      paperProfileId: "prof-01",
      widthMm: 160,
      heightMm: 40,
      columns: 48,
      rows: 32,
      zoneIds: ["z-00", "z-01", "z-02", "z-03", "z-04", "z-05", "z-06", "z-07"],
      renderer: "Canvas",
      fixtureRevisionId: "rev-01"
    };

    // Paper response (synthetic lookup)
    const responseCurve: number[] = [];
    for(let i=0; i<=4095; i++){
      responseCurve.push(Math.min(255, Math.floor(i / 16)));
    }
    const paperProfile: PaperProfile = {
      id: "prof-01",
      label: "Synthetic RC",
      bias: 0,
      responseCurve
    };

    const calSources: CalibrationSource[] = [
      { id: "cal-02", label: "Lamp A", revisionId: "rev-02", outputFactorMilli: 1000 },
      { id: "cal-07", label: "Lamp B", revisionId: "rev-07", outputFactorMilli: 1000 }
    ];

    // Passes
    const passes: ExposurePassRecord[] = [
      { id: "pass-01", order: 1, label: "Demo 1", durationDs: 20, mask: { xMm: 0, yMm: 0, widthMm: 160, heightMm: 40, rectangleHash: "rect-1" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "fixture", eventId: "evt-0", status: "active" },
      { id: "pass-02", order: 2, label: "Demo 2", durationDs: 20, mask: { xMm: 40, yMm: 0, widthMm: 120, heightMm: 40, rectangleHash: "rect-2" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "fixture", eventId: "evt-0", status: "active" },
      { id: "pass-03", order: 3, label: "Demo 3", durationDs: 20, mask: { xMm: 60, yMm: 0, widthMm: 100, heightMm: 40, rectangleHash: "rect-3" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "fixture", eventId: "evt-0", status: "active" },
      // The editable ones
      { id: "pass-04", order: 4, label: "Proposed 4", durationDs: 20, mask: { xMm: 80, yMm: 0, widthMm: 80, heightMm: 40, rectangleHash: "rect-a5d0" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "mara", eventId: "evt-0", status: "active" },
      { id: "pass-05", order: 5, label: "Proposed 5", durationDs: 20, mask: { xMm: 120, yMm: 0, widthMm: 40, heightMm: 40, rectangleHash: "rect-5" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "mara", eventId: "evt-0", status: "active" },
      { id: "pass-06", order: 6, label: "Proposed 6", durationDs: 20, mask: { xMm: 140, yMm: 0, widthMm: 20, heightMm: 40, rectangleHash: "rect-6" }, calibrationSourceId: "cal-02", calibrationRevisionId: "rev-02", outputFactorMilli: 1000, actorId: "mara", eventId: "evt-0", status: "active" }
    ];

    set({ negative, strip, paperProfile, calibrationSources: calSources, passes, decisions: [], history: [] });
    get().computeExposures();
  },

  setCanvasViewport: (_vp) => set({}),
  setRenderer: (r) => set({ renderer: r }),
  setPreviewMode: (m) => set({ previewMode: m }),

  selectPass: (id) => set({ selectedPassId: id }),

  previewMaskEdit: (passId, mask) => {
    const p = get().passes.find(x => x.id === passId);
    if(p) set({ dragPreviewPass: { ...p, mask } });
    // Don't recompute global exposures for transient, let UI overlay compute
  },

  commitMaskEdit: (passId, mask) => {
    const p = get().passes.find(x => x.id === passId);
    if(!p) return;

    // Check if decision exists, mark stale
    let updatedDecisions = [...get().decisions];

    updatedDecisions = updatedDecisions.map(d => {
      if(d.status === 'fresh') {

        return { ...d, status: 'stale' };
      }
      return d;
    });

    const evtId = "evt-" + Date.now();
    const evt: HistoryEvent = {
      id: evtId,
      logicalAt: new Date().toISOString(),
      actorId: "mara",
      kind: "pass_updated",
      status: "accepted",
      parentId: null,
      branchId: null,
      targetId: passId,
      revisionId: evtId,
      patchBefore: p.mask,
      patchAfter: mask,
      reason: null,
      stateHash: "hash-" + evtId
    };

    const updatedPasses = get().passes.map(x =>
      x.id === passId ? { ...x, mask: { ...mask, rectangleHash: "rect-" + evtId }, eventId: evtId } : x
    );

    set({ passes: updatedPasses, dragPreviewPass: null, decisions: updatedDecisions, history: [...get().history, evt] });
    get().computeExposures();
  },

  cancelMaskEdit: () => set({ dragPreviewPass: null }),

  selectZone: (id) => set({ selectedZoneId: id }),

  commitZoneDecision: (zoneId, rationale, sources) => {
    const id = "dec-" + Date.now();
    const d: ZoneDecisionRecord = {
      id,
      zoneId,
      passSetHash: "psh",
      calibrationSetHash: "csh",
      metricsHash: "mh",
      rationale,
      confidence: "working",
      sourceIds: sources,
      actorId: "mara",
      logicalAt: new Date().toISOString(),
      parentDecisionId: null,
      correctionIds: [],
      status: "fresh"
    };

    const evt: HistoryEvent = {
      id: "evt-" + Date.now(),
      logicalAt: new Date().toISOString(),
      actorId: "mara",
      kind: "decision_made",
      status: "accepted",
      parentId: null,
      branchId: null,
      targetId: id,
      revisionId: id,
      patchBefore: null,
      patchAfter: d,
      reason: null,
      stateHash: "hash-" + Date.now()
    };

    set({ decisions: [...get().decisions.map(x => ({...x, status: 'stale' as const})), d], history: [...get().history, evt] });
  },

  previewRecipeRebase: (_passId, _newFactor) => {},

  commitRecipeRebase: (passId, newFactor) => {
    const updatedPasses = get().passes.map(x =>
      x.id === passId ? { ...x, outputFactorMilli: newFactor } : x
    );
    // Find active decision, mark stale, create child decision
    const decisions = [...get().decisions];
    const activeIdx = decisions.findIndex(d => d.status === 'fresh');
    let newDecisions = decisions;
    if(activeIdx >= 0) {
      const parent = decisions[activeIdx];
      decisions[activeIdx] = { ...parent, status: 'stale' };
      const child: ZoneDecisionRecord = {
        ...parent,
        id: "dec-" + Date.now(),
        parentDecisionId: parent.id,
        status: "fresh",
        correctionIds: ["corr-new"]
      };
      newDecisions.push(child);
    }

    set({ passes: updatedPasses, decisions: newDecisions });
    get().computeExposures();
  },

  computeExposures: () => {
    const { passes, strip, negative, paperProfile } = get();
    if(!strip || !negative || !paperProfile) return;

    const cellExposures = new Map<string, { passIds: string[], effectiveMilliDs: number, responseValue: number }>();
    const zoneMetrics = new Map<string, { targetError: number, highlightReserve: number, shadowSeparation: number, clippingCount: number, rank: number }>();

    // Cell w/h in mm
    const cellWMm = strip.widthMm / strip.columns;
    const cellHMm = strip.heightMm / strip.rows;
    const cellArea = cellWMm * cellHMm;

    // Active passes
    const activePasses = passes.filter(p => p.status === 'active');

    const zoneValues: Record<string, { err: number, hr: number, ss: number, clip: number }> = {};
    for (const z of strip.zoneIds) {
      zoneValues[z] = { err: 0, hr: 0, ss: 0, clip: 0 };
    }

    for(let r=0; r<strip.rows; r++) {
      for(let c=0; c<strip.columns; c++) {
        const cellId = `pc-r${r.toString().padStart(2, '0')}-c${c.toString().padStart(2, '0')}`;

        // Logical bounds of cell
        const cx = c * cellWMm;
        const cy = r * cellHMm;
        const cx2 = cx + cellWMm;
        const cy2 = cy + cellHMm;

        let effectiveMilliDs = 0;
        const passIds: string[] = [];

        for(const p of activePasses) {
          const px = p.mask.xMm;
          const py = p.mask.yMm;
          const px2 = px + p.mask.widthMm;
          const py2 = py + p.mask.heightMm;

          // Intersection logic
          const ix1 = Math.max(cx, px);
          const iy1 = Math.max(cy, py);
          const ix2 = Math.min(cx2, px2);
          const iy2 = Math.min(cy2, py2);

          if(ix1 < ix2 && iy1 < iy2) {
            const ixArea = (ix2 - ix1) * (iy2 - iy1);
            // Half-open rules: exact half counts as covered
            // Since JS floats are iffy, allow a tiny epsilon or use exact fractions.
            // cellArea is rational. ixArea >= cellArea / 2
            if (ixArea >= (cellArea / 2) - 0.0001) {
              passIds.push(p.id);
              effectiveMilliDs += (p.durationDs * p.outputFactorMilli);
            }
          }
        }

        const negDensity = negative.densityRows[r][c];
        let exposureIndex = (negDensity * 32) + Math.round((effectiveMilliDs / 1000) * 12) + paperProfile.bias;
        if(exposureIndex < 0) exposureIndex = 0;
        if(exposureIndex > 4095) exposureIndex = 4095;

        const responseValue = paperProfile.responseCurve[exposureIndex];

        cellExposures.set(cellId, { passIds, effectiveMilliDs, responseValue });

        // Determine zone for cell (6 cols per zone)
        const zoneIdx = Math.floor(c / 6);
        const zId = `z-0${zoneIdx}`;
        if(zoneValues[zId]) {
           // mock target error summation
           zoneValues[zId].err += Math.abs(128 - responseValue);
           if(responseValue === 0 || responseValue === 255) zoneValues[zId].clip += 1;
        }
      }
    }

    // Sort zones
    const sorted = Object.entries(zoneValues).map(([zId, v]) => ({
      id: zId,
      targetError: v.err,
      highlightReserve: 10,
      shadowSeparation: 10,
      clippingCount: v.clip
    })).sort((a,b) => a.targetError - b.targetError || a.clippingCount - b.clippingCount);

    sorted.forEach((z, i) => {
      zoneMetrics.set(z.id, { targetError: z.targetError, highlightReserve: z.highlightReserve, shadowSeparation: z.shadowSeparation, clippingCount: z.clippingCount, rank: i+1 });
    });

    set({ cellExposures, zoneMetrics });
  }
}));
