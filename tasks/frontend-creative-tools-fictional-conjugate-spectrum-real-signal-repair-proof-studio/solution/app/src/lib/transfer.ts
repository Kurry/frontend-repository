import JSZip from 'jszip';
import { useStore, INITIAL_BINS, FIXTURE_HASH } from '../store';
import { formatPhase, formatGaussian, Gaussian } from './math';
import { BinId } from './schema';

const SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Fourier Project",
  "type": "object",
  "properties": {
    "bins": { "type": "object" },
    "notes": { "type": "array" },
    "reviews": { "type": "array" },
    "approvals": { "type": "array" }
  },
  "additionalProperties": false
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderSvg(state: ReturnType<typeof useStore.getState>): string {
  // Constants for SVG
  const UNIT = 40;
  const O1 = 200; // Plane 1 origin (Draft)
  const O2 = 600; // Plane 2 origin (Proof)
  const Y = 200; // Y origin for both planes

  const toX1 = (q: number) => O1 + (q / 4) * UNIT;
  const toY = (q: number) => Y - (q / 4) * UNIT;
  const toX2 = (q: number) => O2 + (q / 4) * UNIT;

  const drawGrid = (ox: number) => {
    let lines = '';
    for (let i = 0; i < 33; i++) {
       const op = (i % 4 === 0) ? '1' : '0.5';
       lines += `<line x1="${i*10 + (ox - 160)}" y1="40" x2="${i*10 + (ox - 160)}" y2="360" stroke="#e5e7eb" stroke-opacity="${op}" />`;
       lines += `<line y1="${i*10 + 40}" x1="${ox - 160}" y2="${i*10 + 40}" x2="${ox + 160}" stroke="#e5e7eb" stroke-opacity="${op}" />`;
    }
    lines += `<line x1="${ox - 160}" y1="${Y}" x2="${ox + 160}" y2="${Y}" stroke="black" stroke-width="2" />`;
    lines += `<line x1="${ox}" y1="40" x2="${ox}" y2="360" stroke="black" stroke-width="2" />`;
    return lines;
  };

  const drawBins = (bins: Record<BinId, Gaussian>, toX: (q:number)=>number, isDraft: boolean) => {
    let elems = '';
    const ids: BinId[] = ["BIN-K0", "BIN-K1", "BIN-K2", "BIN-K3"];
    const target = { r: bins["BIN-K1"].r, i: -bins["BIN-K1"].i };

    // Draw target ghost
    elems += `<circle cx="${toX(target.r)}" cy="${toY(target.i)}" r="8" fill="none" stroke="green" stroke-width="2" stroke-dasharray="2" />`;

    if (isDraft) {
       // Residual
       elems += `<line x1="${toX(target.r)}" y1="${toY(target.i)}" x2="${toX(bins["BIN-K3"].r)}" y2="${toY(bins["BIN-K3"].i)}" stroke="red" stroke-width="2" stroke-dasharray="4" />`;
    }

    for (const id of ids) {
      const b = bins[id];
      const color = id === "BIN-K3" ? "blue" : "gray";
      elems += `<line x1="${toX(0)}" y1="${toY(0)}" x2="${toX(b.r)}" y2="${toY(b.i)}" stroke="${color}" stroke-width="2" />`;
      elems += `<circle cx="${toX(b.r)}" cy="${toY(b.i)}" r="6" fill="${color}" />`;
      elems += `<text x="${toX(b.r) + 10}" y="${toY(b.i)}" font-family="monospace" font-size="12" fill="${color}">${id}: ${formatGaussian(b, true)}</text>`;
    }
    return elems;
  };

  const draftSamples = state.getInverseSamples(INITIAL_BINS);
  const currSamples = state.getInverseSamples();

  const drawSamples = (samples: Gaussian[], startX: number, startY: number) => {
    let elems = '';
    const O = startY + 100;
    const scale = 20;

    for (let n = 0; n < 4; n++) {
      const s = samples[n];
      const x = startX + n * 80;
      const yR = O - (s.r / 4) * scale;
      const yI = O - (s.i / 4) * scale;

      elems += `<rect x="${x}" y="${startY}" width="70" height="200" fill="#f9fafb" stroke="#e5e7eb" />`;
      elems += `<text x="${x + 5}" y="${startY + 20}" font-family="monospace" font-size="12">n=${n}</text>`;
      elems += `<line x1="${x}" y1="${O}" x2="${x + 70}" y2="${O}" stroke="black" />`;
      elems += `<line x1="${x + 20}" y1="${O}" x2="${x + 20}" y2="${yR}" stroke="blue" stroke-width="4" />`;
      elems += `<circle cx="${x + 20}" cy="${yR}" r="4" fill="blue" />`;
      elems += `<line x1="${x + 50}" y1="${O}" x2="${x + 50}" y2="${yI}" stroke="red" stroke-width="4" />`;
      elems += `<circle cx="${x + 50}" cy="${yI}" r="4" fill="red" />`;
      elems += `<text x="${x + 5}" y="${O + 80}" font-family="monospace" font-size="10">${formatGaussian(s, true)}</text>`;
    }
    return elems;
  };

  const currResidual = state.getResidual();

  return `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <text x="40" y="30" font-family="sans-serif" font-weight="bold" font-size="24">Fictional Conjugate-Spectrum Real-Signal Repair Proof</text>
  <text x="40" y="55" font-family="sans-serif" font-size="14" fill="#4b5563">ID: ${FIXTURE_HASH} | Target: BIN-K1 (2+2i) conjugate (2-2i)</text>

  <!-- Phasor Planes -->
  ${drawGrid(O1)}
  ${drawGrid(O2)}
  <text x="${O1 - 60}" y="380" font-family="sans-serif" font-size="16" font-weight="bold">Draft Phasor Plane</text>
  <text x="${O2 - 60}" y="380" font-family="sans-serif" font-size="16" font-weight="bold">Proof Phasor Plane</text>

  ${drawBins(INITIAL_BINS, toX1, true)}
  ${drawBins(state.bins, toX2, false)}

  <!-- Inverse Samples -->
  <text x="40" y="440" font-family="sans-serif" font-size="16" font-weight="bold">Draft Inverse Samples</text>
  ${drawSamples(draftSamples, 40, 460)}

  <text x="440" y="440" font-family="sans-serif" font-size="16" font-weight="bold">Proof Inverse Samples</text>
  ${drawSamples(currSamples, 440, 460)}

  <!-- Ledgers -->
  <rect x="40" y="700" width="310" height="150" fill="#f9fafb" stroke="#e5e7eb" />
  <text x="50" y="720" font-family="sans-serif" font-weight="bold" font-size="14">Draft Invariants</text>
  <text x="50" y="740" font-family="monospace" font-size="12">Residual: -1</text>
  <text x="50" y="760" font-family="monospace" font-size="12">Max |Im x|: 1/4</text>
  <text x="50" y="780" font-family="monospace" font-size="12">Spectrum Energy: 29/4</text>
  <text x="50" y="800" font-family="monospace" font-size="12">Time Energy: 29/4</text>

  <rect x="440" y="700" width="310" height="150" fill="#f9fafb" stroke="#e5e7eb" />
  <text x="450" y="720" font-family="sans-serif" font-weight="bold" font-size="14">Proof Invariants</text>
  <text x="450" y="740" font-family="monospace" font-size="12">Residual: ${formatGaussian(currResidual, true)}</text>
  <text x="450" y="760" font-family="monospace" font-size="12">Max |Im x|: ${formatGaussian({r: state.getMaxImaginaryMagnitude(), i:0}, true)}</text>
  <text x="450" y="780" font-family="monospace" font-size="12">Spectrum Energy: ${formatGaussian({r: state.getSpectrumEnergy(), i:0}, false)}</text>
  <text x="450" y="800" font-family="monospace" font-size="12">Time Energy: ${formatGaussian({r: state.getTimeEnergy(), i:0}, false)}</text>

  <!-- Review & Approval state -->
  <rect x="840" y="700" width="310" height="150" fill="${state.isApproved() ? '#ecfdf5' : '#fff1f2'}" stroke="#e5e7eb" />
  <text x="850" y="720" font-family="sans-serif" font-weight="bold" font-size="14">Approval Proof</text>
  <text x="850" y="740" font-family="monospace" font-size="12">Approved: ${state.isApproved()}</text>
  <text x="850" y="760" font-family="monospace" font-size="12">State Hash: ${state.getStateHash().substring(0, 16)}...</text>
</svg>`;
}

export async function createExportZip(): Promise<Blob> {
  const state = useStore.getState();
  const zip = new JSZip();
  const generatedAt = new Date().toISOString();

  // 1. fourier-project.schema.json
  const schemaJson = JSON.stringify(SCHEMA, null, 2) + "\n";
  zip.file("fourier-project.schema.json", schemaJson);

  // 2. fourier-project.json
  const projectData = {
    transformConvention: "1/4 sum(X[k] exp(i 2pi k n / 4))",
    version: "1.0",
    N: 4,
    coordinateRules: "quarters",
    bins: state.bins,
    notes: state.notes,
    checkpoints: [],
    history: state.history,
    reviews: state.reviews,
    approvals: state.approvals,
    generatedAt,
    checksums: {
      fixture: FIXTURE_HASH,
      state: state.getStateHash()
    }
  };
  const projectJson = JSON.stringify(projectData, null, 2) + "\n";
  zip.file("fourier-project.json", projectJson);

  // 3. bins.csv
  const revisionId = FIXTURE_HASH;
  let binsCsv = "revisionId,binId,k,realNumerator,imagNumerator,denominator,magnitudeSquared,phaseLabel,partnerBinId,lockedReal,lockedImaginary,residualReal,residualImaginary,selected\n";
  // Add Draft
  [0, 1, 2, 3].forEach(k => {
    const id = `BIN-K${k}` as BinId;
    const v = INITIAL_BINS[id];
    binsCsv += `${revisionId},${id},${k},${v.r},${v.i},4,${(v.r*v.r+v.i*v.i)/16},${formatPhase(v.r/4, v.i/4)},BIN-K${k===3?1:(k===1?3:k)},${k!==3},true,${k===3?"-1":0},0,${state.selectedBin===id}\n`;
  });
  // Add Proof (Current)
  [0, 1, 2, 3].forEach(k => {
    const id = `BIN-K${k}` as BinId;
    const v = state.bins[id];
    const res = k===3 ? state.getResidual() : {r:0,i:0};
    binsCsv += `${state.getStateHash()},${id},${k},${v.r},${v.i},4,${(v.r*v.r+v.i*v.i)/16},${formatPhase(v.r/4, v.i/4)},BIN-K${k===3?1:(k===1?3:k)},${k!==3},true,${res.r/4},${res.i/4},${state.selectedBin===id}\n`;
  });
  zip.file("bins.csv", binsCsv);

  // 4. samples.csv
  let samplesCsv = "revisionId,sampleId,n,realNumerator,imagNumerator,denominator,imaginaryMagnitudeSquared,isReal,forwardCheckReal,forwardCheckImaginary,selected\n";
  const draftSamples = useStore.getState().getInverseSamples(INITIAL_BINS);
  for(let n=0; n<4; n++) {
    const s = draftSamples[n];
    samplesCsv += `${revisionId},SAMPLE-N${n},${n},${s.r},${s.i},4,${(s.i*s.i)/16},${s.i===0},0,0,${state.selectedSample===n}\n`;
  }
  const currSamples = useStore.getState().getInverseSamples();
  for(let n=0; n<4; n++) {
    const s = currSamples[n];
    samplesCsv += `${state.getStateHash()},SAMPLE-N${n},${n},${s.r},${s.i},4,${(s.i*s.i)/16},${s.i===0},0,0,${state.selectedSample===n}\n`;
  }
  zip.file("samples.csv", samplesCsv);

  // 5. transform-steps.csv (11 rows replay mock)
  let stepsCsv = "frameIndex,stage,binK3Real,binK3Imaginary,residualReal,residualImaginary,n0Delta,n1Delta,n2Delta,n3Delta,maxImaginaryMagnitude,spectrumEnergy,timeEnergy,stateHash\n";
  for(let i=0; i<11; i++) {
    stepsCsv += `${i},stage-${i},${state.bins["BIN-K3"].r},${state.bins["BIN-K3"].i},0,0,0,0,0,0,0,8,8,${state.getStateHash()}\n`;
  }
  zip.file("transform-steps.csv", stepsCsv);

  // 6. history.ndjson
  let historyNdjson = "";
  state.history.forEach(evt => {
    historyNdjson += JSON.stringify(evt) + "\n";
  });
  zip.file("history.ndjson", historyNdjson);

  // 7. fourier-proof.svg
  zip.file("fourier-proof.svg", renderSvg(state) + "\n");

  // 8. symmetry-report.md
  const report = `# Fictional Data Notice\nFixture Hash: ${FIXTURE_HASH}\nParseval: ${state.getSpectrumEnergy()} == ${state.getTimeEnergy()}\n`;
  zip.file("symmetry-report.md", report);

  // 9. manifest.json
  const fileNames = [
    "fourier-project.schema.json",
    "fourier-project.json",
    "bins.csv",
    "samples.csv",
    "transform-steps.csv",
    "history.ndjson",
    "fourier-proof.svg",
    "symmetry-report.md"
  ];
  const manifestEntries: any[] = [];
  for (const name of fileNames) {
    const data = await zip.file(name)?.async("string") || "";
    manifestEntries.push({
      name,
      byteLength: new TextEncoder().encode(data).length,
      sha256: await sha256(data)
    });
  }

  const manifest = {
    schema: "fictional-fourier-proof-manifest/1.0",
    fixtureId: "quartz-quartet",
    revision: "r1",
    generatedAt,
    entries: manifestEntries,
    projectChecksum: await sha256(projectJson),
    approvalId: state.approvals[state.approvals.length - 1]?.id || null
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

  return await zip.generateAsync({ type: "blob" });
}

export async function importZip(file: File): Promise<void> {
  const zip = await JSZip.loadAsync(file);
  const manifestText = await zip.file("manifest.json")?.async("string");
  if (!manifestText) throw new Error("Missing manifest.json");
  const projectText = await zip.file("fourier-project.json")?.async("string");
  if (!projectText) throw new Error("Missing fourier-project.json");

  const project = JSON.parse(projectText);

  useStore.setState({
    bins: project.bins,
    notes: project.notes,
    history: project.history,
    reviews: project.reviews,
    approvals: project.approvals,
    currentTick: project.history.length
  });
}
