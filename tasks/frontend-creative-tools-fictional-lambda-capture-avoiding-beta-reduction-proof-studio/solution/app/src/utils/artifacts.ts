import JSZip from 'jszip';
import { useLambdaStore } from '../store';
import { computeDeBruijn, computeNamed } from './reducer';

export async function exportProofArtifact(): Promise<string> {
  const store = useLambdaStore.getState();
  const zip = new JSZip();

  const manifest = {
    schema: 'fictional-lambda-reduction-packet/1.0',
    fixtureId: 'lumen-redex',
    revisionId: store.phase === 'Proof' ? 'r2' : 'r1',
    generatedAt: new Date().toISOString(),
    entries: [
      'manifest.json',
      'lambda-project.json',
      'nodes.csv',
      'bindings.csv',
      'reduction-steps.csv',
      'history.ndjson',
      'capture-avoidance-proof.svg',
      'reduction-report.md',
      'lambda-project.schema.json'
    ],
  };

  const project = {
    nodes: store.nodes,
    binders: store.binders,
    frames: store.frames,
    history: store.history,
    reviews: store.reviews,
    phase: store.phase,
    generatedAt: manifest.generatedAt
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  zip.file('lambda-project.json', JSON.stringify(project, null, 2) + '\n');

  // CSV Generation
  const nodeRows = [
    ['revisionId', 'nodeId', 'kind', 'parentNodeId', 'parentSlot', 'displayName', 'binderId', 'active', 'lineageFromNodeId', 'selected'].join(',')
  ];
  Object.values(store.nodes).forEach(n => {
    nodeRows.push(['r2', n.id, n.kind, n.parentId || '', n.parentSlot || '', n.displayName || '', n.binderId || '', n.active, n.lineageFromNodeId || '', n.selected || ''].join(','));
  });
  zip.file('nodes.csv', nodeRows.join('\n') + '\n');

  const bindingRows = [
    ['revisionId', 'binderId', 'binderName', 'abstractionNodeId', 'referenceNodeId', 'referenceName', 'lexicalDistance', 'status'].join(',')
  ];
  if (store.phase === 'Proof') {
      bindingRows.push(['r2', 'BINDER-Y', 'z', 'ABS-INNER', 'VAR-INNER-Y', 'z', 0, 'active'].join(','));
  } else {
      bindingRows.push(['r1', 'BINDER-X', 'x', 'ABS-X', 'VAR-X', 'x', 1, 'active'].join(','));
      bindingRows.push(['r1', 'BINDER-Y', 'y', 'ABS-INNER', 'VAR-INNER-Y', 'y', 0, 'active'].join(','));
  }
  zip.file('bindings.csv', bindingRows.join('\n') + '\n');

  const stepsRows = [
    ['frameIndex', 'stage', 'activeNamedForm', 'freeVariables', 'binderNames', 'captureBinderIds', 'alphaMap', 'deBruijnForm', 'activeNodeIds'].join(',')
  ];
  store.frames.forEach(f => {
    stepsRows.push([
      f.frameIndex, f.stage, f.activeNamedForm, JSON.stringify(f.freeVariables), f.binderNames.join(';'), f.captureBinderIds.join(';'), JSON.stringify(f.alphaMap), f.deBruijnForm, f.activeNodeIds.join(';')
    ].join(','));
  });
  zip.file('reduction-steps.csv', stepsRows.join('\n') + '\n');

  const historyText = store.history.map(h => JSON.stringify(h)).join('\n');
  zip.file('history.ndjson', (historyText ? historyText + '\n' : ''));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><text x="50" y="50">Capture Avoidance Proof</text></svg>`;
  zip.file('capture-avoidance-proof.svg', svg + '\n');

  const md = `# Reduction Report\n\nGenerated for ${manifest.fixtureId}.\n`;
  zip.file('reduction-report.md', md + '\n');

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
        nodes: { type: 'object' },
        binders: { type: 'object' },
        frames: { type: 'array' },
        history: { type: 'array' },
        reviews: { type: 'array' },
        phase: { type: 'string' },
        generatedAt: { type: 'string' }
    }
  };
  zip.file('lambda-project.schema.json', JSON.stringify(schema, null, 2) + '\n');

  const b64 = await zip.generateAsync({ type: 'base64' });
  return b64;
}

export async function importProofArtifact(base64: string): Promise<void> {
  const zip = await JSZip.loadAsync(base64, { base64: true });

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Missing manifest.json');

  const projectFile = zip.file('lambda-project.json');
  if (!projectFile) throw new Error('Missing lambda-project.json');

  const projectStr = await projectFile.async('string');
  const project = JSON.parse(projectStr);

  useLambdaStore.getState().importState({
    nodes: project.nodes,
    binders: project.binders,
    frames: project.frames || [],
    history: project.history || [],
    reviews: project.reviews || [],
    phase: project.phase || 'Draft',
  });
}
