import React from 'react';
import { useStore } from '../store/useStore';

export const ArtifactsPanel: React.FC = () => {
  const store = useStore();

  const handleExport = (type: string) => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (type === 'json') {
      // Exclude UI state
      const { currentFrame, activeTakeId, onionSkinPrev, onionSkinNext, selectedRangeIds, selectedObjectIds, ...projectData } = store;
      content = JSON.stringify(projectData, null, 2);
      filename = 'stop-motion-project.json';
      mimeType = 'application/json';
    } else if (type === 'csv') {
      content = 'shot,frameStart,frameEnd,type,track,take,state\n' +
        store.ranges.map(r => `${r.shotId},${r.startFrame},${r.endFrame},${r.type},${r.trackId},${r.takeId},${r.state}`).join('\n');
      filename = 'exposure-sheet.csv';
      mimeType = 'text/csv';
    } else if (type === 'md') {
      content = `# Cut Notes\n\nRevision: ${store.approvals[store.approvals.length-1]?.cutRevision || 0}\n\n`;
      content += `## Shots\n` + store.shots.map(s => `- ${s.name}: ${s.endFrame - s.startFrame + 1} frames`).join('\n');
      filename = 'cut-notes.md';
      mimeType = 'text/markdown';
    } else if (type === 'svg') {
      content = `<svg xmlns="http://www.w3.org/2000/svg" width="5040" height="100"><text x="10" y="20">Timing Map</text></svg>`;
      filename = 'timing-map.svg';
      mimeType = 'image/svg+xml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    // Do not immediately remove the anchor to avoid Playwright race condition as noted in Memory
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-2 flex gap-2 overflow-x-auto">
      <button onClick={() => store.resetToFixture()} className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded border border-red-300 hover:bg-red-200 shrink-0">Reset</button>
      <div className="w-px bg-gray-300 mx-1"></div>
      <button onClick={() => handleExport('json')} className="px-3 py-1 bg-gray-100 text-xs rounded border hover:bg-gray-200 shrink-0">Export JSON</button>
      <button onClick={() => handleExport('csv')} className="px-3 py-1 bg-gray-100 text-xs rounded border hover:bg-gray-200 shrink-0">Export CSV</button>
      <button onClick={() => handleExport('md')} className="px-3 py-1 bg-gray-100 text-xs rounded border hover:bg-gray-200 shrink-0">Export MD</button>
      <button onClick={() => handleExport('svg')} className="px-3 py-1 bg-gray-100 text-xs rounded border hover:bg-gray-200 shrink-0">Export SVG</button>
    </div>
  );
};
