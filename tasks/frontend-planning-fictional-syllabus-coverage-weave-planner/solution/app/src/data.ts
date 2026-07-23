import type { StudyPlan } from './types';

export const domains = [
  { id: 'DOM-1', name: 'Foundations' },
  { id: 'DOM-2', name: 'Methodology' },
  { id: 'DOM-3', name: 'Analysis' },
  { id: 'DOM-4', name: 'Synthesis' },
];

export const objectives = [
  { id: 'OBJ-01', title: 'Core Definitions', domainId: 'DOM-1', targetMinutes: 60, weightBps: 800, prerequisites: [] },
  { id: 'OBJ-02', title: 'Historical Context', domainId: 'DOM-1', targetMinutes: 45, weightBps: 700, prerequisites: ['OBJ-01'] },
  { id: 'OBJ-03', title: 'Quantitative Principles', domainId: 'DOM-2', targetMinutes: 120, weightBps: 1500, prerequisites: [] },
  { id: 'OBJ-04', title: 'Qualitative Methods', domainId: 'DOM-2', targetMinutes: 90, weightBps: 1200, prerequisites: [] },
  { id: 'OBJ-05', title: 'Data Collection', domainId: 'DOM-2', targetMinutes: 60, weightBps: 800, prerequisites: ['OBJ-04'] },
  { id: 'OBJ-06', title: 'Statistical Inference', domainId: 'DOM-3', targetMinutes: 120, weightBps: 1000, prerequisites: ['OBJ-03'] },
  { id: 'OBJ-07', title: 'Regression Analysis', domainId: 'DOM-3', targetMinutes: 90, weightBps: 800, prerequisites: ['OBJ-03', 'OBJ-06'] },
  { id: 'OBJ-08', title: 'Case Studies', domainId: 'DOM-3', targetMinutes: 60, weightBps: 700, prerequisites: ['OBJ-04'] },
  { id: 'OBJ-09', title: 'Advanced Modeling', domainId: 'DOM-3', targetMinutes: 120, weightBps: 500, prerequisites: ['OBJ-07'] },
  { id: 'OBJ-10', title: 'Literature Review', domainId: 'DOM-4', targetMinutes: 45, weightBps: 400, prerequisites: [] },
  { id: 'OBJ-11', title: 'Drafting Findings', domainId: 'DOM-4', targetMinutes: 90, weightBps: 600, prerequisites: ['OBJ-05', 'OBJ-08'] },
  { id: 'OBJ-12', title: 'Final Review', domainId: 'DOM-4', targetMinutes: 120, weightBps: 1000, prerequisites: ['OBJ-11', 'OBJ-09'] },
];

export const sessions = [
  { id: 'SES-01', startIso: '2026-09-01T18:00:00-04:00', durationMinutes: 120, energy: 'medium' },
  { id: 'SES-02', startIso: '2026-09-02T18:00:00-04:00', durationMinutes: 90, energy: 'high' },
  { id: 'SES-03', startIso: '2026-09-03T10:00:00-04:00', durationMinutes: 60, energy: 'high' },
  { id: 'SES-04', startIso: '2026-09-03T18:00:00-04:00', durationMinutes: 90, energy: 'medium' },
  { id: 'SES-05', startIso: '2026-09-04T18:00:00-04:00', durationMinutes: 120, energy: 'low' },
  { id: 'SES-06', startIso: '2026-09-05T10:00:00-04:00', durationMinutes: 180, energy: 'high' },
  { id: 'SES-07', startIso: '2026-09-06T10:00:00-04:00', durationMinutes: 120, energy: 'medium' },
  { id: 'SES-08', startIso: '2026-09-08T18:00:00-04:00', durationMinutes: 90, energy: 'medium' },
  { id: 'SES-09', startIso: '2026-09-10T18:00:00-04:00', durationMinutes: 120, energy: 'high' },
  { id: 'SES-10', startIso: '2026-09-11T18:00:00-04:00', durationMinutes: 90, energy: 'low' },
  { id: 'SES-11', startIso: '2026-09-12T10:00:00-04:00', durationMinutes: 180, energy: 'high' },
  { id: 'SES-12', startIso: '2026-09-13T10:00:00-04:00', durationMinutes: 120, energy: 'high' },
  { id: 'SES-13', startIso: '2026-09-15T18:00:00-04:00', durationMinutes: 90, energy: 'medium' },
  { id: 'SES-14', startIso: '2026-09-16T18:00:00-04:00', durationMinutes: 120, energy: 'low' },
];

export const prerequisites = [
  { id: 'PRE-1', fromId: 'OBJ-01', toId: 'OBJ-02' },
  { id: 'PRE-2', fromId: 'OBJ-04', toId: 'OBJ-05' },
  { id: 'PRE-3', fromId: 'OBJ-03', toId: 'OBJ-06' },
  { id: 'PRE-4', fromId: 'OBJ-03', toId: 'OBJ-07' },
  { id: 'PRE-5', fromId: 'OBJ-06', toId: 'OBJ-07' },
  { id: 'PRE-6', fromId: 'OBJ-04', toId: 'OBJ-08' },
  { id: 'PRE-7', fromId: 'OBJ-07', toId: 'OBJ-09' },
  { id: 'PRE-8', fromId: 'OBJ-05', toId: 'OBJ-11' },
  { id: 'PRE-9', fromId: 'OBJ-08', toId: 'OBJ-11' },
  { id: 'PRE-10', fromId: 'OBJ-11', toId: 'OBJ-12' },
  { id: 'PRE-11', fromId: 'OBJ-09', toId: 'OBJ-12' },
];

export const baselineAllocations = [
  { id: 'KNOT-01', objectiveId: 'OBJ-01', sessionId: 'SES-01', minutes: 60, order: 0 },
  { id: 'KNOT-02', objectiveId: 'OBJ-02', sessionId: 'SES-01', minutes: 45, order: 1 },
  { id: 'KNOT-03', objectiveId: 'OBJ-04', sessionId: 'SES-02', minutes: 90, order: 0 },
  { id: 'KNOT-04', objectiveId: 'OBJ-05', sessionId: 'SES-03', minutes: 60, order: 0 },
  { id: 'KNOT-05', objectiveId: 'OBJ-10', sessionId: 'SES-04', minutes: 45, order: 0 },
  { id: 'KNOT-06', objectiveId: 'OBJ-08', sessionId: 'SES-04', minutes: 15, order: 1 },
  { id: 'KNOT-07', objectiveId: 'OBJ-07', sessionId: 'SES-05', minutes: 90, order: 0 },
  { id: 'KNOT-08', objectiveId: 'OBJ-06', sessionId: 'SES-06', minutes: 120, order: 0 },
  { id: 'KNOT-09', objectiveId: 'OBJ-03', sessionId: 'SES-06', minutes: 60, order: 1 },
  { id: 'KNOT-10', objectiveId: 'OBJ-08', sessionId: 'SES-07', minutes: 45, order: 0 },
  { id: 'KNOT-11', objectiveId: 'OBJ-11', sessionId: 'SES-07', minutes: 45, order: 1 },
  { id: 'KNOT-12', objectiveId: 'OBJ-11', sessionId: 'SES-08', minutes: 45, order: 0 },
  { id: 'KNOT-13', objectiveId: 'OBJ-09', sessionId: 'SES-08', minutes: 45, order: 1 },
  { id: 'KNOT-14', objectiveId: 'OBJ-09', sessionId: 'SES-09', minutes: 75, order: 0 },
  { id: 'KNOT-15', objectiveId: 'OBJ-03', sessionId: 'SES-09', minutes: 15, order: 1 },
  { id: 'KNOT-16', objectiveId: 'OBJ-12', sessionId: 'SES-11', minutes: 120, order: 0 },
  { id: 'KNOT-17', objectiveId: 'OBJ-03', sessionId: 'SES-09', minutes: 30, order: 2 },
  { id: 'KNOT-18', objectiveId: 'OBJ-01', sessionId: 'SES-10', minutes: 15, order: 0 },
  { id: 'KNOT-19', objectiveId: 'OBJ-02', sessionId: 'SES-10', minutes: 15, order: 1 },
  { id: 'KNOT-20', objectiveId: 'OBJ-04', sessionId: 'SES-11', minutes: 15, order: 1 },
  { id: 'KNOT-21', objectiveId: 'OBJ-05', sessionId: 'SES-12', minutes: 15, order: 0 },
  { id: 'KNOT-22', objectiveId: 'OBJ-06', sessionId: 'SES-12', minutes: 15, order: 1 },
  { id: 'KNOT-23', objectiveId: 'OBJ-07', sessionId: 'SES-13', minutes: 15, order: 0 },
  { id: 'KNOT-24', objectiveId: 'OBJ-08', sessionId: 'SES-13', minutes: 15, order: 1 },
  { id: 'KNOT-25', objectiveId: 'OBJ-09', sessionId: 'SES-14', minutes: 15, order: 0 },
  { id: 'KNOT-26', objectiveId: 'OBJ-10', sessionId: 'SES-14', minutes: 15, order: 1 },
  { id: 'KNOT-27', objectiveId: 'OBJ-11', sessionId: 'SES-14', minutes: 15, order: 2 },
  { id: 'KNOT-28', objectiveId: 'OBJ-12', sessionId: 'SES-14', minutes: 15, order: 3 },
];

export const generateEvents = () => {
  const events = [];
  for (let i = 0; i < 36; i++) {
    events.push({
      id: `EVT-${i+1}`,
      type: 'allocation.create',
      actorId: 'Sol',
      scenarioId: 'Baseline',
      timestamp: new Date().toISOString(),
      payload: {},
      hash: `hash-${i}`
    });
  }
  return events;
}

export const initialStudyPlan: StudyPlan = {
  schema: 'fictional-syllabus-weave/1.0',
  fixtureId: 'glass-orchard',
  timezone: 'America/Detroit',
  logicalToday: '2026-09-01T00:00:00-04:00',
  examAt: '2026-09-18T00:00:00-04:00',
  objectives: objectives as any,
  domains: domains as any,
  sessions: sessions as any,
  scenarios: [
    {
      id: 'Baseline',
      name: 'Baseline',
      allocations: baselineAllocations,
      events: generateEvents(),
    },
    {
      id: 'Recovery',
      name: 'Recovery',
      allocations: JSON.parse(JSON.stringify(baselineAllocations)),
      events: generateEvents(),
    },
    {
      id: 'Compact',
      name: 'Compact',
      allocations: JSON.parse(JSON.stringify(baselineAllocations)),
      events: generateEvents(),
    }
  ],
  prerequisites: prerequisites as any,
  annotations: [
    {
      id: 'NOTE-08',
      knotId: 'KNOT-17',
      authorId: 'Sol',
      content: 'Make sure to cover this quantitative principle early.',
      createdAt: '2026-09-02T10:00:00-04:00'
    }
  ],
  rehearsal: null,
  approvals: [],
  workspace: {
    activeScenarioId: 'Baseline',
    selectedEntityId: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    brush: null,
    filters: {},
    inspectorTab: 'details',
    compareScenarioId: null,
    replayCursor: null,
    historyAnchor: null,
  },
  generatedAt: new Date().toISOString()
};
