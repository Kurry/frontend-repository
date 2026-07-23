import { useStore } from '../store/useStore';
import { ZipMaker } from './zip';

export const exportMatchPacket = async () => {
  const state = useStore.getState();
  const zip = new ZipMaker();

  const projectJson = {
    schema: "fictional-quilt-motif-match-v1",
    schemaVersion: 1,
    logicalClock: state.logicalClock,
    studies: state.studies,
    motifs: state.motifs,
    globalRanking: state.globalRanking,
    decisions: state.decisions,
    corrections: state.corrections,
    revalidations: state.revalidations,
    annotations: state.annotations,
    events: state.events,
    exportedAt: new Date().toISOString()
  };
  zip.addFile('motif-project.json', JSON.stringify(projectJson, null, 2));

  const studyRows = [
    'studyId,title,logicalWidth,logicalHeight,sourceRevisionId,rasterHash,cropId,cropX,cropY,cropWidth,cropHeight,queryHash,queryRows'
  ];
  for (const s of state.studies) {
    const crop = state.canonicalCrop?.studyId === s.id ? state.canonicalCrop : null;
    studyRows.push([
      s.id, s.title, s.logicalWidth, s.logicalHeight, s.sourceRevisionId, s.rasterHash,
      crop ? crop.id : '',
      crop ? crop.x : '',
      crop ? crop.y : '',
      crop ? crop.width : '',
      crop ? crop.height : '',
      crop ? crop.queryHash : '',
      crop ? crop.queryRows.join('|') : ''
    ].join(','));
  }
  zip.addFile('studies.csv', studyRows.join('\n'));

  const matchRows = [
    'queryHash,rank,motifId,title,family,catalogRevisionId,rasterHash,bestTransform,distance,scoreNumerator,scoreDenominator,scoreDisplay,mismatchCellIds,decisionId,decisionStatus,approvalState'
  ];
  for (const m of state.globalRanking) {
    const motif = state.motifs.find(x => x.id === m.motifId);
    matchRows.push([
      m.queryHash, m.rank, m.motifId, motif?.title || '', motif?.family || '',
      m.catalogRevision, m.candidateHash, m.bestTransform, m.distance,
      m.scoreNumerator, m.scoreDenominator, m.scoreDisplay,
      m.mismatchCellIds.join('|'),
      m.decisionId || '',
      m.decisionStatus || '',
      state.approvalState.status
    ].join(','));
  }
  zip.addFile('matches.csv', matchRows.join('\n'));

  const jsonld = {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "type": "AnnotationPage",
    "items": state.annotations.map(a => ({
      id: a.id,
      type: "Annotation",
      body: { type: "TextualBody", value: a.text },
      target: a.targetId
    }))
  };
  zip.addFile('annotations.jsonld', JSON.stringify(jsonld, null, 2));

  const queryProofSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><text x="10" y="20">Query Proof</text></svg>`;
  zip.addFile('query-proof.svg', queryProofSvg);

  const contactSheetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><text x="10" y="20">Contact Sheet</text></svg>`;
  zip.addFile('ranked-contact-sheet.svg', contactSheetSvg);

  zip.addFile('match-report.md', '# Fictional Quilt Motif Match Report\n\nData disclaimer: This is fictional data.');

  const manifest = {
    schema: "fictional-quilt-motif-manifest-v1",
    generatedAt: new Date().toISOString(),
    files: [
      'motif-project.json', 'studies.csv', 'matches.csv', 'annotations.jsonld',
      'query-proof.svg', 'ranked-contact-sheet.svg', 'match-report.md'
    ]
  };
  zip.addFile('manifest.json', JSON.stringify(manifest, null, 2));

  const blob = zip.generate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'north-window-motif-match.zip';
  a.click();
  URL.revokeObjectURL(url);
};
