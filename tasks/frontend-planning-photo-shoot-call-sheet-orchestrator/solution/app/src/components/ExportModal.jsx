import React from 'react';
import { useStore } from '../store';
import { exportCanonicalJson } from '../utils/exportImport';
import { generateICS, generateCSV, generateMarkdown, generateSVG } from '../utils/formatters';

export default function ExportModal({ onClose }) {
  const state = useStore(state => state);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-6">
        <h2 className="text-lg font-bold mb-4">Export Artifacts</h2>
        <div className="flex flex-col gap-2">
          <button onClick={() => downloadFile(exportCanonicalJson(state), 'session.json', 'application/json')} className="bg-blue-50 text-blue-700 py-2 rounded hover:bg-blue-100">Export JSON</button>
          <button onClick={() => downloadFile(generateICS(state), 'schedule.ics', 'text/calendar')} className="bg-gray-50 text-gray-700 py-2 rounded hover:bg-gray-100 border">Export ICS</button>
          <button onClick={() => downloadFile(generateCSV(state), 'ledger.csv', 'text/csv')} className="bg-gray-50 text-gray-700 py-2 rounded hover:bg-gray-100 border">Export CSV</button>
          <button onClick={() => downloadFile(generateMarkdown(state), 'callsheet.md', 'text/markdown')} className="bg-gray-50 text-gray-700 py-2 rounded hover:bg-gray-100 border">Export Markdown</button>
          <button onClick={() => downloadFile(generateSVG(state), 'maps.svg', 'image/svg+xml')} className="bg-gray-50 text-gray-700 py-2 rounded hover:bg-gray-100 border">Export SVG</button>
        </div>
        <button onClick={onClose} className="mt-4 w-full bg-gray-900 text-white py-2 rounded">Close</button>
      </div>
    </div>
  );
}
