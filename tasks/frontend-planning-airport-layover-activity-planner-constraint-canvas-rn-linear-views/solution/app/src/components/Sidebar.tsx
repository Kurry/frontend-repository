import React, { useState, useRef } from 'react';
import { useStore } from '../Store';
import { Undo, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SessionState } from '../Store';

export function Sidebar() {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRecords = state.records.filter(r => r.status !== 'archived');
  const derived = state.derived;

  const handleExport = () => {
    const dataToExport: SessionState = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layover-plan-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload.schemaVersion !== 'v1' || !Array.isArray(payload.records)) {
          setErrorMsg('Invalid artifact: malformed schema');
          return;
        }

        // rudimentary field level validation
        const isValid = payload.records.every((r: any) =>
          r.id && r.title && typeof r.duration === 'number' &&
          ['draft', 'ready', 'changed', 'archived'].includes(r.status) &&
          ['Hour 1', 'Hour 2', 'Hour 3'].includes(r.lane)
        );

        if (!isValid) {
          setErrorMsg('Invalid record bounds or status found in artifact');
          return;
        }

        setErrorMsg(null);
        dispatch({ type: 'IMPORT', payload });
      } catch (err) {
        setErrorMsg('Invalid JSON');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  return (
    <div className="w-full md:w-80 bg-white border-l p-6 flex flex-col h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Derived Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center">
            <AlertCircle className="text-red-500 mb-1" size={24} />
            <div className="text-2xl font-bold text-red-600">{derived.conflictCount}</div>
            <div className="text-xs text-red-600 font-medium">Conflicts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center">
            <CheckCircle2 className="text-green-500 mb-1" size={24} />
            <div className="text-2xl font-bold text-green-600">{derived.readyCount}</div>
            <div className="text-xs text-green-600 font-medium">Ready/Changed</div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Activities</h3>
        <div className="space-y-3">
          {activeRecords.map(record => (
            <div key={record.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
               <div className="font-medium text-gray-700">{record.title}</div>
               <div className="text-gray-500 mt-1 flex justify-between">
                 <span>{record.lane}</span>
                 <span>{record.duration}m</span>
               </div>
               <div className="mt-2 flex justify-end">
                 <button
                   onClick={() => dispatch({ type: 'DELETE', payload: record.id })}
                   className="text-xs text-red-500 hover:text-red-700 font-medium"
                 >
                   Archive
                 </button>
               </div>
            </div>
          ))}
          {activeRecords.length === 0 && (
            <p className="text-sm text-gray-500">No active activities.</p>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={state.history.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Undo size={16} />
            Undo
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export
          </button>

          <label className="flex-1 flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-2">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
