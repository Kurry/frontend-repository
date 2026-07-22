import React from 'react';
import { getSnapshot, updateState } from '../store';
import { formatISO } from 'date-fns';
import type { SessionArtifact } from '../types';

export function Header() {
  const handleExport = () => {
    const state = getSnapshot();
    const artifact: SessionArtifact = {
      schemaVersion: 'v1',
      exportedAt: formatISO(new Date()),
      records: state.records,
      derived: {
        totalTasks: state.records.length,
        draftCount: state.records.filter((r) => r.status === 'draft').length,
        readyCount: state.records.filter((r) => r.status === 'ready').length,
        changedCount: state.records.filter((r) => r.status === 'changed').length,
        archivedCount: state.records.filter((r) => r.status === 'archived').length,
      },
      history: state.history,
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garden-workday-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const data = JSON.parse(text) as SessionArtifact;

          if (data.schemaVersion !== 'v1') {
            alert('Invalid schema version. Expected v1.');
            return;
          }

          if (!Array.isArray(data.records) || !Array.isArray(data.history)) {
            alert('Invalid data format. Missing records or history array.');
            return;
          }

          updateState((prev) => ({
            ...prev,
            records: data.records,
            history: data.history,
            selectedTaskId: null,
            activeTimelineEventId: null,
            filterStatus: 'all',
          }));

          alert('Import successful!');
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Community Garden Workday Planner</h1>
      <div className="flex gap-3">
        <button
          onClick={handleImport}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          Clear & Import
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm"
        >
          Export
        </button>
      </div>
    </header>
  );
}
