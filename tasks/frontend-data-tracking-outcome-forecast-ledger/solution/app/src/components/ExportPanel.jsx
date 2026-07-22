import React from 'react';
import { useStore } from '../store.js';
import { exportSession, exportCSV, exportSVG } from '../exportUtils.js';

export default function ExportPanel() {
  const state = useStore();

  const handleExportJson = () => {
    const json = exportSession(state);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'ledger.json');
  };

  const handleExportCSV = () => {
    const csv = exportCSV(state);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, 'ledger.csv');
  };

  const handleExportSVG = () => {
    const svg = exportSVG(state);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, 'ledger.svg');
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Export Artifacts</h2>
      <div className="flex flex-col gap-2">
        <button onClick={handleExportJson} className="bg-gray-800 text-white px-2 py-1 rounded hover:bg-black text-sm">Download Session JSON</button>
        <button onClick={handleExportCSV} className="bg-gray-800 text-white px-2 py-1 rounded hover:bg-black text-sm">Download CSV Ledger</button>
        <button onClick={handleExportSVG} className="bg-gray-800 text-white px-2 py-1 rounded hover:bg-black text-sm">Download SVG Report</button>
      </div>
    </div>
  );
}
