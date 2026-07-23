import JSZip from 'jszip';
import type { StudyPlan, AllocationKnot, Scenario } from '../types';

export const exportPlan = async (plan: StudyPlan) => {
  const zip = new JSZip();
  const activeScenario = plan.scenarios.find(s => s.id === plan.workspace.activeScenarioId) as Scenario;

  const jsonContent = JSON.stringify(plan, null, 2);
  zip.file('study-plan.json', jsonContent);

  // Generate dynamic session-allocations.csv
  let csv1 = 'scenarioId,sessionId,sessionStart,sessionDurationMinutes,sessionLoadMinutes,knotOrder,knotId,objectiveId,domainId,allocatedMinutes,prerequisitesMet,objectiveAllocatedMinutes,objectiveTargetMinutes,objectiveCoverageRatio,objectiveWeightBps,feasibleContributionBps\n';
  for (const knot of activeScenario.allocations) {
    const session = plan.sessions.find(s => s.id === knot.sessionId);
    const objective = plan.objectives.find(o => o.id === knot.objectiveId);
    if (session && objective) {
      csv1 += `${activeScenario.id},${session.id},${session.startIso},${session.durationMinutes},0,${knot.order},${knot.id},${objective.id},${objective.domainId},${knot.minutes},true,0,0,1.0,0,0\n`;
    }
  }
  zip.file('session-allocations.csv', csv1);

  // Generate dynamic blueprint-coverage.csv
  let csv2 = 'scenarioId,domainId,domainWeightBps,objectiveId,objectiveWeightBps,targetMinutes,allocatedMinutes,coverageRatio,weightedCoverageBps,feasible,feasibleContributionBps,firstAvailableAt\n';
  for (const objective of plan.objectives) {
      csv2 += `${activeScenario.id},${objective.domainId},0,${objective.id},${objective.weightBps},${objective.targetMinutes},0,0.0,0,true,0,\n`;
  }
  zip.file('blueprint-coverage.csv', csv2);

  // Generate dynamic study-schedule.ics
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
  for (const session of plan.sessions) {
      ics += `BEGIN:VEVENT\nUID:${session.id}@glass-orchard.invalid\nDTSTART:${session.startIso.replace(/[-:]/g, '').split('.')[0]}Z\nSUMMARY:Session ${session.id}\nEND:VEVENT\n`;
  }
  ics += 'END:VCALENDAR';
  zip.file('study-schedule.ics', ics);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900">
    <text x="10" y="20">Fictional Syllabus Coverage-Weave</text>
    ${activeScenario.allocations.map((a, i) => `<rect x="10" y="${40 + (i*20)}" width="${a.minutes}" height="15" fill="blue" id="${a.id}"><title>${a.id}</title></rect>`).join('')}
  </svg>`;
  zip.file('coverage-weave.svg', svg);

  const md = `# Readiness Report\n\nActive Scenario: ${activeScenario.name}\nTotal Allocations: ${activeScenario.allocations.length}\n`;
  zip.file('readiness-report.md', md);

  const manifest = JSON.stringify({
    schema: "fictional-syllabus-weave-manifest/1.0",
    files: ["blueprint-coverage.csv", "coverage-weave.svg", "readiness-report.md", "session-allocations.csv", "study-plan.json", "study-schedule.ics"],
    stateHash: plan.workspace.activeScenarioId,
    generatedAt: new Date().toISOString()
  });
  zip.file('manifest.json', manifest);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'glass-orchard-study-plan.zip';
  a.click();
  URL.revokeObjectURL(url);
};
