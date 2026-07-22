import { useStore } from '../store';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export function exportJSON() {
  const state = useStore.getState();
  const data = {
    schemaVersion: state.schemaVersion,
    pieces: state.pieces,
    shelves: state.shelves,
    witnesses: state.witnesses,
    curve: state.curve,
    batch: state.batch,
    adjacencyExceptions: state.adjacencyExceptions,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `kiln-session-${Date.now()}.json`);
}

export function exportCSV() {
    const state = useStore.getState();
    const csv = Papa.unparse(state.pieces.map(p => ({
        id: p.id,
        mass: p.mass,
        shelfId: p.shelfId || '',
        status: p.status,
        clayLot: p.clayLot
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `kiln-ledger-${Date.now()}.csv`);
}

export function exportSVG() {
    const state = useStore.getState();
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
        <text x="10" y="20" font-family="monospace">Kiln Load Map</text>
    `;

    state.shelves.forEach((shelf, idx) => {
        const cy = 100 + (idx * 200);
        svgContent += `<circle cx="400" cy="${cy}" r="80" fill="none" stroke="black" />`;
        svgContent += `<text x="400" y="${cy}" text-anchor="middle" font-size="10">${shelf.id}</text>`;
    });

    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    saveAs(blob, `kiln-map-${Date.now()}.svg`);
}

export function exportMarkdown() {
    const state = useStore.getState();
    const md = `# Kiln Runbook

## Curve
${state.curve.map(c => `- ${c.type}: ${c.startTemp} to ${c.endTemp} in ${c.duration}m`).join('\n')}

## Batch Events
${state.batch.events.map(e => `- ${e.type}`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, `kiln-runbook-${Date.now()}.md`);
}
