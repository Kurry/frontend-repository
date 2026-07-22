import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStore } from '../store';

export async function generateArtifact() {
  const store = useStore.getState();
  const zip = new JSZip();

  // 2. print-run-project.json
  const projectJson = JSON.stringify({
    poster: store.poster,
    passes: store.passes,
    inkSources: store.inkSources,
    intervals: store.intervals,
    cells: store.cells,
    decisions: store.decisions,
    annotations: store.annotations,
    approval: store.approval,
    events: store.events,
    logicalTick: store.logicalTick,
    orderHash: store.orderHash,
    cellProofHash: store.cellProofHash,
    scheduleHash: store.scheduleHash,
    generatedAt: new Date().toISOString()
  });
  zip.file('print-run-project.json', projectJson);

  // 3. passes.csv
  let passesCsv = "passId,order,inkSourceId,inkRevisionId,x,y,width,height,printTicks,settleTicks,printStart,printEnd,settleStart,settleEnd,maskHash,eventId,status\n";
  const sortedPasses = Object.values(store.passes).sort((a, b) => a.order - b.order);
  for (const p of sortedPasses) {
    const ink = store.inkSources[p.inkSourceId];
    const printInt = store.intervals.find(i => i.passId === p.id && i.kind === 'print');
    const settleInt = store.intervals.find(i => i.passId === p.id && i.kind === 'settle');
    passesCsv += `${p.id},${p.order},${p.inkSourceId},${p.inkRevisionId},${p.mask.x},${p.mask.y},${p.mask.width},${p.mask.height},${p.printTicks},${ink?.settleTicks||0},${printInt?.startTick},${printInt?.endTick},${settleInt?.startTick},${settleInt?.endTick},${p.mask.maskHash},${p.eventId},${p.status}\n`;
  }
  zip.file('passes.csv', passesCsv);

  // 4. cells.csv
  let cellsCsv = "cellId,row,column,coveringPassIds,orderedContributorIds,red,green,blue,overlapCount,selected,orderHash,cellProofHash\n";
  for (const c of store.cells) {
    cellsCsv += `${c.cellId},${c.row},${c.col},"${c.coveringPassIds.join(';')}", "${c.orderedContributorIds.join(';')}",${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${c.coveringPassIds.length},${store.selectedCells.has(c.cellId)},${store.orderHash},${store.cellProofHash}\n`;
  }
  zip.file('cells.csv', cellsCsv);

  // 5. events.ndjson
  let eventsNdjson = "";
  for (const ev of store.events) {
    eventsNdjson += JSON.stringify(ev) + "\n";
  }
  zip.file('events.ndjson', eventsNdjson);

  // 6. composite-proof.svg
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">${store.cells.map(c => `<rect x="${c.col * 10}" y="${c.row * 10}" width="10" height="10" fill="rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})" />`).join('')}</svg>`;
  zip.file('composite-proof.svg', svg);

  // 7. rack-plan.svg
  const rackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">${store.intervals.map((i, idx) => `<rect x="${i.startTick}" y="${(idx%4)*20}" width="${i.endTick - i.startTick}" height="10" fill="${i.kind==='print'?'blue':'orange'}" />`).join('')}</svg>`;
  zip.file('rack-plan.svg', rackSvg);

  // 8. run-card.txt
  const runCard = `SIMULATION ONLY — NOT PRINTING INSTRUCTION\nCompletion Tick: ${Math.max(...store.intervals.map(i=>i.endTick), 0)}\nOrder Hash: ${store.orderHash}\n`;
  zip.file('run-card.txt', runCard);

  // 9. print-run-project.schema.json
  zip.file('print-run-project.schema.json', JSON.stringify({ "$id": "fictional-print-run-packet/v1" }));

  // 1. manifest.json (needs hashes in a real system, stubbed here)
  const manifest = JSON.stringify({
    schemaVersion: "fictional-print-run-packet/v1",
    exportedAt: new Date().toISOString(),
    files: ['print-run-project.json', 'passes.csv', 'cells.csv', 'events.ndjson', 'composite-proof.svg', 'rack-plan.svg', 'run-card.txt', 'print-run-project.schema.json'],
    orderHash: store.orderHash
  });
  zip.file('manifest.json', manifest);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'lantern-steps-run.zip');
}
