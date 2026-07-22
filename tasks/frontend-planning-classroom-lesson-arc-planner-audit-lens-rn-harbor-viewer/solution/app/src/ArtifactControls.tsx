import React, { useRef } from 'react';
import type { ClassroomLessonArcPlannerSession, DerivedState } from './types';

interface ArtifactControlsProps {
  onExport: () => ClassroomLessonArcPlannerSession;
  onImport: (session: any) => void;
  onClear: () => void;
  derived: DerivedState;
}

export const ArtifactControls: React.FC<ArtifactControlsProps> = ({
  onExport,
  onImport,
  onClear,
  derived
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-audit-lens.json';
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
        const json = JSON.parse(event.target?.result as string);
        onImport(json);
      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Failed to parse JSON file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Derived Summary</h3>
      <div className="grid grid-cols-3 gap-4 text-center mb-2">
        <div className="p-3 bg-slate-50 rounded">
          <div className="text-2xl font-light text-blue-600">{derived.summary.totalBlocks}</div>
          <div className="text-xs text-slate-500 mt-1">Active Blocks</div>
        </div>
        <div className="p-3 bg-slate-50 rounded">
          <div className="text-2xl font-light text-emerald-600">{derived.summary.resolvedDiscrepancies}</div>
          <div className="text-xs text-slate-500 mt-1">Resolved</div>
        </div>
        <div className="p-3 bg-slate-50 rounded">
          <div className="text-2xl font-light text-amber-600">{derived.summary.totalDurationMins}</div>
          <div className="text-xs text-slate-500 mt-1">Total Mins</div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 flex gap-2 justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Export JSON
          </button>

          <label className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
        </div>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear the session?")) onClear();
          }}
          className="px-3 py-1.5 text-sm font-medium text-red-600 border border-transparent rounded hover:bg-red-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
