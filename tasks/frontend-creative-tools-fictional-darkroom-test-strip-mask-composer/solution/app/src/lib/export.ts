import JSZip from 'jszip';
import type { AppState } from './store';

export const exportZip = async (state: AppState) => {
  const zip = new JSZip();

  const manifest = { schemaVersion: "darkroom-test-strip-packet/v1", exportedAt: new Date().toISOString() };
  const project = {
    schemaVersion: "darkroom-test-strip-packet/v1",
    projectId: state.projectId,
    fixtureRevisionId: state.fixtureRevisionId,
    negative: state.negative,
    strip: state.strip,
    paperProfile: state.paperProfile,
    calibrationSources: state.calibrationSources,
    passes: state.passes,
    decisions: state.decisions,
    history: state.history,
    historyAnchorId: state.historyAnchorId,
    generatedAt: new Date().toISOString()
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('darkroom-project.json', JSON.stringify(project, null, 2));

  let passesCsv = 'passId,order,label,durationDs,xMm,yMm,widthMm,heightMm,calibrationSourceId,calibrationRevisionId,outputFactorMilli,rectangleHash,eventId,status\n';
  for(const p of state.passes) {
    passesCsv += `${p.id},${p.order},"${p.label}",${p.durationDs},${p.mask.xMm},${p.mask.yMm},${p.mask.widthMm},${p.mask.heightMm},${p.calibrationSourceId},${p.calibrationRevisionId},${p.outputFactorMilli},${p.mask.rectangleHash},${p.eventId},${p.status}\n`;
  }
  zip.file('passes.csv', passesCsv);

  let zoneSamplesCsv = 'zoneId,cellId,negativeDensity,coveringPassIds,authoredExposureDs,effectiveExposureMilliDs,responseIndex,responseValue,targetError,clippingCount,highlightReserve,shadowSeparation,rank\n';
  zip.file('zone-samples.csv', zoneSamplesCsv);

  const svgMasks = state.passes.map(p => `<rect x="${p.mask.xMm}" y="${p.mask.yMm}" width="${p.mask.widthMm}" height="${p.mask.heightMm}" fill="rgba(255,255,255,0.1)" stroke="#00f" />`).join('');
  zip.file('test-strip-proof.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><rect width="160" height="40" fill="#333" />${svgMasks}</svg>`);
  zip.file('mask-plan.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><rect width="160" height="40" fill="#222" />${svgMasks}</svg>`);

  let eventsNdjson = '';
  for(const ev of state.history) {
    eventsNdjson += JSON.stringify(ev) + '\n';
  }
  zip.file('events.ndjson', eventsNdjson);

  zip.file('print-recipe.txt', 'SIMULATION ONLY — NOT PHOTOGRAPHIC INSTRUCTION\nZone: ' + (state.decisions.find(d => d.status === 'fresh')?.zoneId || 'None') + '\n');
  zip.file('darkroom-project.schema.json', '{"$schema":"https://json-schema.org/draft/2020-12/schema"}');

  const content = await zip.generateAsync({ type: 'blob' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'north-window-test-strip.zip';
  a.click();
};
