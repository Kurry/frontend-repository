import { state } from './store';

export function getActiveCues(cues, branchState) {
  return cues.filter(cue => {
    if (!cue.contingencyGroup) return true;
    return branchState[cue.contingencyGroup] === (cue.isContingency ? 'contingency' : 'primary');
  });
}

export function computeTimeline(cues, branchState) {
  const activeCues = getActiveCues(cues, branchState);
  const computed = new Map();
  const getStart = (cId, visited = new Set()) => {
    if (computed.has(cId)) return computed.get(cId);
    if (visited.has(cId)) throw new Error("Cycle detected");
    const cue = activeCues.find(c => c.id === cId);
    if (!cue) return { start: 0, end: 0, actualStart: 0 };
    visited.add(cId);
    let actualStart = cue.plannedStart;
    if (!cue.isFixed && cue.trigger && cue.trigger.sourceCueId) {
      const sourceTime = getStart(cue.trigger.sourceCueId, visited);
      if (cue.trigger.type === 'after') {
        actualStart = sourceTime.end + (cue.trigger.offset || 0);
      } else if (cue.trigger.type === 'with') {
        actualStart = sourceTime.actualStart + (cue.trigger.offset || 0);
      }
    }
    const end = actualStart + cue.duration;
    const res = { start: cue.plannedStart, actualStart, end, cue };
    computed.set(cId, res);
    return res;
  };
  const results = [];
  for (const cue of activeCues) {
    results.push(getStart(cue.id));
  }
  return results;
}

export function deriveConflicts(cues, resources, branchState) {
  const timeline = computeTimeline(cues, branchState);
  const conflicts = [];
  const exclusiveIntervals = [];
  for (const { actualStart, end, cue } of timeline) {
    if (cue.resourceIds && cue.resourceIds.length > 0) {
      cue.resourceIds.forEach(resId => {
        const resourceDef = resources.find(r => r.id === resId);
        if (resourceDef && !resourceDef.shared) {
          exclusiveIntervals.push({ resId, start: actualStart, end, cueId: cue.id });
        }
      });
    }
  }
  for (let i = 0; i < exclusiveIntervals.length; i++) {
    for (let j = i + 1; j < exclusiveIntervals.length; j++) {
      const a = exclusiveIntervals[i];
      const b = exclusiveIntervals[j];
      if (a.resId === b.resId) {
        if (a.start < b.end && a.end > b.start) {
          conflicts.push({ type: 'resource_collision', resourceId: a.resId, cues: [a.cueId, b.cueId], time: Math.max(a.start, b.start) });
        }
      }
    }
  }
  for (const cue of getActiveCues(cues, branchState)) {
    if (!cue.ready) {
      conflicts.push({ type: 'readiness', cueId: cue.id, time: cue.plannedStart });
    }
  }
  return conflicts;
}

export function computeProjectedEnd(cues, branchState) {
  const timeline = computeTimeline(cues, branchState);
  return timeline.reduce((max, t) => Math.max(max, t.end), 0);
}
