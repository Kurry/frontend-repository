import type { Plan } from './schema';
import { calculateSchedule } from './math';

export const INITIAL_PLAN: Plan = {
  planId: "PLAN-01",
  revision: 12,
  planStart: "2034-04-12T09:00:00.000Z",
  reviewGate: "2034-04-12T12:15:00.000Z",
  tasks: [
    { id: "TASK-01", label: "Gather references", durationMinutes: 20, lane: "main", x: 40, y: 40 },
    { id: "TASK-02", label: "Sort cards", durationMinutes: 30, lane: "main", x: 260, y: 40 },
    { id: "TASK-03", label: "Draft captions", durationMinutes: 45, lane: "main", x: 480, y: 40 },
    { id: "TASK-04", label: "Print labels", durationMinutes: 25, lane: "main", x: 700, y: 40 },
    { id: "TASK-05", label: "Proof labels", durationMinutes: 20, lane: "main", x: 920, y: 40 },
    { id: "TASK-06", label: "Fold inserts", durationMinutes: 30, lane: "parallel", x: 480, y: 160 },
    { id: "TASK-07", label: "Pack folio", durationMinutes: 25, lane: "parallel", x: 700, y: 160, requiredPredecessorIds: ["TASK-05", "TASK-06"] },
    { id: "TASK-08", label: "Photograph packet", durationMinutes: 15, lane: "parallel", x: 920, y: 160 }
  ],
  clips: [
    { id: "CLIP-01", status: "committed", sourceTaskId: "TASK-01", targetTaskId: "TASK-02", routeKind: "direct", routePoints: [], revision: 1, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-02", status: "committed", sourceTaskId: "TASK-02", targetTaskId: "TASK-03", routeKind: "direct", routePoints: [], revision: 2, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-03", status: "committed", sourceTaskId: "TASK-03", targetTaskId: "TASK-04", routeKind: "direct", routePoints: [], revision: 3, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-04", status: "committed", sourceTaskId: "TASK-04", targetTaskId: "TASK-05", routeKind: "direct", routePoints: [], revision: 4, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-05", status: "committed", sourceTaskId: "TASK-02", targetTaskId: "TASK-06", routeKind: "direct", routePoints: [], revision: 5, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-06", status: "committed", sourceTaskId: "TASK-06", targetTaskId: "TASK-07", routeKind: "direct", routePoints: [], revision: 6, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-07", status: "committed", sourceTaskId: "TASK-07", targetTaskId: "TASK-08", routeKind: "direct", routePoints: [], revision: 7, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-08", status: "committed", sourceTaskId: "TASK-01", targetTaskId: "TASK-06", routeKind: "under", routePoints: [], revision: 8, actorId: "Ari", trayCoordinate: null },
    { id: "CLIP-09", status: "loose", sourceTaskId: null, targetTaskId: null, routeKind: null, routePoints: null, revision: 1, actorId: "Ari", trayCoordinate: { x: 1030, y: 112 } },
  ],
  schedule: { intervals: [], criticalTaskIds: [], finish: null, reviewBufferMinutes: 0 },
  issues: [],
  comments: [
    { id: "COMMENT-01", text: "keep proof before packing", actorId: "Sol", anchorIds: ["TASK-07", "CLIP-09"] }
  ],
  selection: { kind: "none", ids: [], primaryId: null },
  viewport: { x: 0, y: 0, zoom: 1 },
  timelineBrush: null,
  rehearsal: { status: "not-run", cursor: 0, events: [], mark: null },
  history: { anchorEventId: "EVT-01", currentEventId: "EVT-34", events: [], branches: [] },
  approval: null,
  generatedAt: null,
  exportedAt: null,
  branchId: "Baseline"
};

const initialCalc = calculateSchedule(INITIAL_PLAN.tasks, INITIAL_PLAN.clips, INITIAL_PLAN.planStart, INITIAL_PLAN.reviewGate);
INITIAL_PLAN.schedule = initialCalc.schedule;
INITIAL_PLAN.issues = initialCalc.issues;
