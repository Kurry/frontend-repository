import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Download, Upload, FileText, FileJson, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

export const Dossier = () => {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState('json');
  const [importText, setImportText] = useState('');

  const generateJSON = () => {
    return JSON.stringify({
      schemaVersion: "home-maintenance-dossier/v1",
      exportedAt: new Date().toISOString(),
      ...state
    }, null, 2);
  };

  const generateCSV = () => {
    let csv = "ID,Type,Name,Room,Readings,Symptoms\n";
    state.assets.forEach(a => {
      const readings = state.readings.filter(r => r.assetId === a.id).length;
      const symptoms = state.symptoms.filter(s => s.assetId === a.id).length;
      csv += `${a.id},${a.type},"${a.name}",${a.roomId},${readings},${symptoms}\n`;
    });
    return csv;
  };

  const generateSVG = () => {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f9fafb"/>
  <text x="20" y="30" font-family="sans-serif" font-size="20">Home System Topology</text>
  ${state.assets.map((a, i) => `<circle cx="${(i%5)*120 + 60}" cy="${Math.floor(i/5)*100 + 80}" r="20" fill="#3b82f6" /><text x="${(i%5)*120 + 60}" y="${Math.floor(i/5)*100 + 120}" font-family="sans-serif" font-size="10" text-anchor="middle">${a.name}</text>`).join('\n  ')}
</svg>`;
  };

  const generateMarkdown = () => {
    let md = `# Maintenance Dossier\nExported: ${new Date().toISOString()}\n\n## Assets\n`;
    state.assets.forEach(a => {
      md += `- **${a.name}** (${a.type})\n`;
    });
    md += `\n## Certifications\n`;
    state.certifications.forEach(c => {
      md += `- ${c.timestamp}: ${c.type} on WO ${c.workOrderId}\n`;
    });
    return md;
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.schemaVersion === "home-maintenance-dossier/v1") {
        dispatch({ type: 'IMPORT_STATE', payload: data });
        setImportText('');
        alert('Import successful');
      } else {
        alert('Invalid schema version');
      }
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const activeContent = () => {
    switch(activeTab) {
      case 'json': return generateJSON();
      case 'csv': return generateCSV();
      case 'svg': return generateSVG();
      case 'md': return generateMarkdown();
      default: return '';
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mt-4">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FileText size={20} className="text-gray-700" /> Export / Import Dossier
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 border rounded shadow-sm flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-semibold text-sm">Export Artifacts</h3>
            <div className="flex gap-1">
              <button className={`p-1.5 rounded ${activeTab === 'json' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('json')} title="JSON"><FileJson size={16} /></button>
              <button className={`p-1.5 rounded ${activeTab === 'csv' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('csv')} title="CSV"><FileSpreadsheet size={16} /></button>
              <button className={`p-1.5 rounded ${activeTab === 'svg' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('svg')} title="SVG"><ImageIcon size={16} /></button>
              <button className={`p-1.5 rounded ${activeTab === 'md' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('md')} title="Markdown"><FileText size={16} /></button>
            </div>
          </div>
          <pre className="flex-1 overflow-auto text-[10px] bg-gray-900 text-gray-100 p-2 rounded font-mono">
            {activeContent()}
          </pre>
          <button className="mt-2 flex items-center justify-center gap-2 bg-gray-800 text-white py-1.5 rounded text-sm hover:bg-gray-900 w-full"
            onClick={() => {
              const blob = new Blob([activeContent()], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dossier.${activeTab === 'md' ? 'markdown' : activeTab}`;
              a.click();
            }}
          >
            <Download size={16} /> Download {activeTab.toUpperCase()}
          </button>
        </div>

        <div className="bg-white p-3 border rounded shadow-sm flex flex-col h-[300px]">
          <h3 className="font-semibold text-sm mb-2 border-b pb-2">Import JSON</h3>
          <textarea
            className="flex-1 border rounded p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Paste exported session JSON here..."
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button className="mt-2 flex items-center justify-center gap-2 bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700 w-full"
            onClick={handleImport}
          >
            <Upload size={16} /> Import Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
