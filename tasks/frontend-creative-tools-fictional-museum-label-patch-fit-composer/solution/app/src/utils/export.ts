import JSZip from 'jszip';
import { useStore } from '../store/index';
import { sha256 } from 'js-sha256';
import { computeLayout } from './metrics';

export const exportPacket = async () => {
  const state = useStore.getState();
  const zip = new JSZip();
  const logicalClock = state.logicalClock;

  // 1. label-project.json
  const projectJson = {
    schema: 'fictional-museum-label-project-v1',
    schemaVersion: 1,
    logicalClock,
    exportedAt: new Date().toISOString(),
    revisions: state.revisions,
    patches: state.patches,
    comments: state.comments,
    sources: state.sources,
    glossary: state.glossary,
    events: state.events
  };
  const projectJsonStr = JSON.stringify(projectJson, null, 2);
  zip.file('label-project.json', projectJsonStr);

  // 2. labels.csv
  const csvHeaders = ['labelId', 'revisionId', 'formatId', 'lineNumber', 'tokenStartId', 'tokenEndId', 'text', 'measuredAdvancePx', 'availableAdvancePx', 'breakReason', 'widowWordCount', 'fitStatus', 'revisionHash'];
  let csvContent = csvHeaders.join(',') + '\n';

  const currentRev = state.revisions[state.currentRevisionId];
  if (currentRev) {
    const formats = ['wall', 'rail', 'mobile'];
    formats.forEach(fmt => {
      const layoutLines = computeLayout(currentRev.tokens, fmt);
      layoutLines.forEach(line => {
        const text = line.tokens.map(t => t.value).join('').replace(/"/g, '""');
        const startId = line.tokens[0]?.id || '';
        const endId = line.tokens[line.tokens.length - 1]?.id || '';
        const widowCount = line.widowWordCount || '';
        csvContent += `${state.activeLabelId},${currentRev.id},${fmt},${line.lineNumber},${startId},${endId},"${text}",${line.measuredWidth},${line.availableWidth},${line.breakReason},${widowCount},${line.status},${currentRev.hash}\n`;
      });
    });
  }
  zip.file('labels.csv', csvContent);

  // 3. patch-events.ndjson
  let ndjsonContent = '';
  Object.values(state.events).forEach(e => {
    ndjsonContent += JSON.stringify({
      eventId: e.id,
      logicalTime: e.logicalTime,
      actorId: e.actorId,
      type: e.type,
      labelId: e.labelId,
      baseRevisionId: e.baseRevisionId,
      resultRevisionId: e.resultRevisionId,
      patchId: e.patchId,
      range: e.range,
      beforeHash: e.beforeHash,
      afterHash: e.afterHash,
      resolution: e.resolution,
      parentEventIds: e.parentEventIds,
      payload: e.payload
    }) + '\n';
  });
  if (ndjsonContent === '') ndjsonContent = '\n';
  zip.file('patch-events.ndjson', ndjsonContent);

  // 4. annotations.jsonld
  const annotations = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'AnnotationPage',
    items: []
  };
  zip.file('annotations.jsonld', JSON.stringify(annotations, null, 2));

  // 5. label-cards.svg
  const cardsSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000"><title>Label Cards Proofs</title><desc>Approved proofs</desc></svg>`;
  zip.file('label-cards.svg', cardsSvg);

  // 6. revision-proof.svg
  const revProofSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><text>Revision Proof</text></svg>`;
  zip.file('revision-proof.svg', revProofSvg);

  // 7. review-report.md
  const markdown = `# Copper Moth Cabinet - LBL-07 Review Report\n\nFictional data disclaimer...\n\nApproved Revision: ${state.currentRevisionId}`;
  zip.file('review-report.md', markdown);

  // 8. manifest.json
  const fileNames = [
    'label-project.json',
    'labels.csv',
    'patch-events.ndjson',
    'annotations.jsonld',
    'label-cards.svg',
    'revision-proof.svg',
    'review-report.md'
  ];

  const manifest: any = {
    schema: 'fictional-museum-label-manifest-v1',
    generatedAt: new Date().toISOString(),
    files: {}
  };

  for (const name of fileNames) {
    const file = zip.file(name);
    if (file) {
      const data = await file.async('uint8array');
      const hash = sha256(data);
      manifest.files[name] = {
        hash,
        byteLength: data.length
      };
    }
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'copper-moth-label-packet.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
