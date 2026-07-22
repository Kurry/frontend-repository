import { state } from './store';
import { computeTimeline, deriveConflicts, computeProjectedEnd } from './analyzer';

export function generateRunSheetArtifact() {
  const timeline = computeTimeline(state.cues, state.branchState);
  const conflicts = deriveConflicts(state.cues, state.resources, state.branchState);
  const projectedEnd = computeProjectedEnd(state.cues, state.branchState);
  return {
    schemaVersion: "live-cue-run-sheet/v1",
    fixtureId: state.fixtureId,
    hash: "mock-hash",
    timezone: state.timezone,
    cues: state.cues,
    resources: state.resources,
    crew: state.crew,
    branchState: state.branchState,
    checkpoints: state.checkpoints,
    rehearsalEvents: state.rehearsalState.events,
    liveEvents: state.liveState.events,
    annotations: state.annotations,
    history: state.history,
    derived: { timeline, conflicts, projectedEnd },
    ics: generateICS(timeline),
    exportedAt: new Date().toISOString()
  };
}
export function generateICS(timeline) {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Live Cue Run-Sheet Director//EN\n";
  const now = new Date();
  timeline.forEach(({ cue, actualStart, end }) => {
    const startDate = new Date(now.getTime() + actualStart * 1000);
    const endDate = new Date(now.getTime() + end * 1000);
    const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    ics += "BEGIN:VEVENT\n";
    ics += `UID:${cue.id}@livecuedirector.local\n`;
    ics += `DTSTAMP:${formatICSDate(now)}\n`;
    ics += `DTSTART:${formatICSDate(startDate)}\n`;
    ics += `DTEND:${formatICSDate(endDate)}\n`;
    ics += `SUMMARY:${cue.name}\n`;
    ics += `DESCRIPTION:Owner: ${cue.ownerId}\\nResources: ${cue.resourceIds.join(', ')}\n`;
    ics += "END:VEVENT\n";
  });
  ics += "END:VCALENDAR";
  return ics;
}
