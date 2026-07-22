import React, { useRef } from 'react';
import { exportZip, parseZipImport } from '../lib/exportImport';
import { useStore } from '../store';
import { Download, Upload, RotateCcw } from 'lucide-react';

export const ExportImportTools: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { resetSchedule, selectiveUndo, replayEvent } = useStore();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await parseZipImport(file);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => resetSchedule()}
        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 font-medium"
      >
        <RotateCcw size={14} /> Reset
      </button>

      <button
        onClick={() => selectiveUndo()}
        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium"
      >
        Undo Weave
      </button>

      <button
        onClick={() => replayEvent()}
        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium"
      >
        Replay
      </button>

      <input
        type="file"
        accept=".zip"
        className="hidden"
        ref={fileRef}
        onChange={handleImport}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 font-medium"
      >
        <Upload size={14} /> Import ZIP
      </button>

      <button
        onClick={() => exportZip()}
        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 font-medium"
      >
        <Download size={14} /> Export Packet
      </button>
    </div>
  );
};
