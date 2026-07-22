import React, { useRef } from 'react';
import { useAppStore } from '../store';
import { HouseholdWasteDiversionTrackerSessionSchema } from '../validation';
import { IconDownload, IconUpload, IconTrash } from '@tabler/icons-react';
import type { HouseholdWasteDiversionTrackerSession } from '../types';

export const ArtifactManager: React.FC = () => {
  const { state, derived, dispatch } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const sessionData: HouseholdWasteDiversionTrackerSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history,
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waste-diversion-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      dispatch({ type: 'CLEAR' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = HouseholdWasteDiversionTrackerSessionSchema.safeParse(json);

        if (parsed.success) {
          // If valid, apply to state
          dispatch({
            type: 'SET_STATE',
            payload: {
              records: parsed.data.records,
              history: parsed.data.history,
            }
          });
          // Regenerate timestamp for export later logic, but state just holds records and history
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          alert(`Import failed. Invalid schema: ${parsed.error.issues[0].path.join('.')} - ${parsed.error.issues[0].message}`);
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Artifact Management</h2>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-md hover:bg-blue-100 border border-blue-200 transition-colors"
        >
          <IconDownload size={18} /> Export Session
        </button>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-md hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          <IconUpload size={18} /> Import
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-md hover:bg-red-100 border border-red-200 transition-colors ml-auto"
        >
          <IconTrash size={18} /> Clear Session
        </button>
      </div>
    </div>
  );
};
