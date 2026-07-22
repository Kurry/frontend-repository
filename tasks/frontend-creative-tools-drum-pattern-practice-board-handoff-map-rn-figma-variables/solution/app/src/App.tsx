import React, { useState, useEffect } from 'react';
import { usePatternStore, DrumPattern, SessionData } from './store';
import { PatternList } from './components/PatternList';
import { HandoffMap } from './components/HandoffMap';
import { ArtifactPanel } from './components/ArtifactPanel';
import { initWebMCP } from './webmcp';
import { Drum } from 'lucide-react';

function App() {
  const store = usePatternStore();
  const [selectedId, setSelectedId] = useState<string | null>(store.records[0]?.id || null);

  useEffect(() => {
    // Expose for WebMCP
    (window as any).__store = store;
    initWebMCP();
  }, [store]);

  const handleAdd = () => {
    const newId = `pattern-${Date.now()}`;
    const newRecord: DrumPattern = {
      id: newId,
      name: `Pattern ${store.records.length + 1}`,
      status: 'empty',
      owner: null,
      beats: Array(4).fill(Array(16).fill(false))
    };
    store.pushHistory([...store.records, newRecord], `Created ${newRecord.name}`);
    setSelectedId(newId);
  };

  const handleUpdate = (id: string, updates: Partial<DrumPattern>) => {
    const newRecords = store.records.map(r => r.id === id ? { ...r, ...updates } : r);
    store.pushHistory(newRecords, `Updated pattern ${id}`);
  };

  const handleDelete = (id: string) => {
    const newRecords = store.records.filter(r => r.id !== id);
    store.pushHistory(newRecords, `Deleted pattern ${id}`);
    if (selectedId === id) setSelectedId(null);
  };

  const handleAssignAndReady = (owner: string) => {
    if (!selectedId) return;
    const newRecords = store.records.map(r =>
      r.id === selectedId ? { ...r, owner, status: 'ready' } : r
    );
    store.pushHistory(newRecords, `Assigned ${selectedId} to ${owner} and marked ready`);
  };

  const selectedRecord = store.records.find(r => r.id === selectedId) || null;

  const sessionData: SessionData = {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: store.records,
    derived: { summary: store.derivedSummary },
    history: store.eventHistory
  };

  const handleClear = () => {
    store.pushHistory([], 'Cleared board');
    setSelectedId(null);
  };

  const handleImport = (records: DrumPattern[]) => {
    store.pushHistory(records, 'Imported session');
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 z-10 shadow-sm relative">
        <PatternList
          records={store.records}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <Drum size={20} />
            <span>Drum Pattern Practice Board</span>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
           <HandoffMap
              selectedRecord={selectedRecord}
              onAssignAndReady={handleAssignAndReady}
              onUndo={store.undo}
              canUndo={store.history.length > 0}
           />
           <ArtifactPanel
              data={sessionData}
              onClear={handleClear}
              onImport={handleImport}
           />
        </main>
      </div>
    </div>
  );
}

export default App;
