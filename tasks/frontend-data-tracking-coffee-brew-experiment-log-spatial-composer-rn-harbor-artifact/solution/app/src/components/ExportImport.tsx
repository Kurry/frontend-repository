import React, { useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload } from 'lucide-react';

export const ExportImport: React.FC = () => {
  const { exportArtifact, importArtifact, derived } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const data = exportArtifact();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!importArtifact(text)) {
        alert('Invalid artifact format or version.');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex gap-4 p-4 bg-slate-900 text-white rounded-lg shadow-lg">
      <div className="flex-1 flex gap-4 items-center">
         <div className="text-sm">
           <span className="text-slate-400">Total Records:</span> <span className="font-bold">{derived.totalCount}</span>
         </div>
         <div className="text-sm">
           <span className="text-slate-400">Avg Yield Ratio:</span> <span className="font-bold">{derived.averageYieldRatio.toFixed(2)}x</span>
         </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
        >
          <Download size={16} /> Export JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileRef}
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
};
