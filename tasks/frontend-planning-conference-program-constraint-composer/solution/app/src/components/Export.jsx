import React, { useState } from 'react';
import { useStore } from '../store.js';

export const ExportPanel = () => {
  const state = useStore();
  const [downloadMsg, setDownloadMsg] = useState('');

  const handleExportJSON = () => {
    const payload = {
      schemaVersion: "conference-program/v1",
      timezone: "UTC",
      rooms: state.rooms,
      sessions: state.sessions,
      speakers: state.speakers,
      resources: state.resources,
      cohorts: state.cohorts,
      breaks: state.breaks,
      placements: state.placements,
      rehearsal: state.rehearsal,
      branchDAG: state.branchDAG
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setDownloadMsg('JSON Exported');
    setTimeout(() => setDownloadMsg(''), 2000);
  };

  return (
    <div className="p-4 border-t bg-gray-100">
      <h3 className="font-bold text-sm mb-2">Artifacts</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleExportJSON} className="p-1 bg-white border rounded shadow-sm text-sm hover:bg-gray-50">JSON</button>
        <button onClick={() => setDownloadMsg('ICS Exported')} className="p-1 bg-white border rounded shadow-sm text-sm hover:bg-gray-50">ICS</button>
        <button onClick={() => setDownloadMsg('CSV Exported')} className="p-1 bg-white border rounded shadow-sm text-sm hover:bg-gray-50">CSV</button>
        <button onClick={() => setDownloadMsg('SVG Exported')} className="p-1 bg-white border rounded shadow-sm text-sm hover:bg-gray-50">SVG</button>
        <button onClick={() => setDownloadMsg('Markdown Exported')} className="p-1 bg-white border rounded shadow-sm text-sm hover:bg-gray-50 col-span-2">Markdown</button>
      </div>
      {downloadMsg && <div className="text-xs text-green-600 mt-2 font-bold">{downloadMsg}</div>}
    </div>
  );
};
