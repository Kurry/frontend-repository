import React, { useState, useEffect } from 'react';
import { useLessonBlocks } from './useLessonBlocks';
import { LessonBlockList } from './LessonBlockList';
import { AuditLens } from './AuditLens';
import { ArtifactControls } from './ArtifactControls';
import { setupWebMCP } from './webmcp';

function App() {
  const hooks = useLessonBlocks();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  useEffect(() => {
    // Re-bind WebMCP whenever hooks state changes
    setupWebMCP(hooks);
  }, [hooks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        hooks.undo();
      }

      // Keyboard job switching for AuditLens
      if (selectedAuditId && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const currentIndex = hooks.records.findIndex(r => r.id === selectedAuditId);
        if (currentIndex !== -1) {
          let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
          // Wrap around
          if (nextIndex < 0) nextIndex = hooks.records.length - 1;
          if (nextIndex >= hooks.records.length) nextIndex = 0;
          setSelectedAuditId(hooks.records[nextIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hooks, selectedAuditId]);

  const selectedRecord = hooks.records.find(r => r.id === selectedAuditId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lesson Arc Planner</h1>
            <p className="text-slate-500 text-sm mt-1">Audit Lens Viewer Workflow</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={hooks.undo}
              disabled={!hooks.canUndo}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo (Cmd/Ctrl + Z)"
            >
              Undo
            </button>
          </div>
        </header>

        {hooks.errorMsg && (
          <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg shadow-sm">
            <span className="font-semibold">Error:</span> {hooks.errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <LessonBlockList
              records={hooks.records}
              createRecord={hooks.createRecord}
              updateRecord={hooks.updateRecord}
              archiveRecord={hooks.archiveRecord}
              onSelectForAudit={setSelectedAuditId}
              selectedId={selectedAuditId}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <AuditLens
              record={selectedRecord}
              onAttachEvidence={hooks.attachEvidenceAndResolve}
              onClose={() => setSelectedAuditId(null)}
            />
            <ArtifactControls
              onExport={hooks.exportArtifact}
              onImport={hooks.importArtifact}
              onClear={hooks.clearSession}
              derived={hooks.derived}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
