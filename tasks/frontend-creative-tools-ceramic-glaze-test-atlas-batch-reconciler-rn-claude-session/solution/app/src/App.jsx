import React, { useState, useEffect } from 'react';
import Collection from './Collection';
import BatchReconciler from './BatchReconciler';
import ArtifactManager from './ArtifactManager';
import { useStore } from './store';

function App() {
  const [selectedIds, setSelectedIds] = useState([]);
  const { undo } = useStore();

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-900 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col gap-4 h-[calc(100vh-2rem)]">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow border border-slate-200 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Ceramic Glaze Test Atlas</h1>
            <p className="text-slate-500 text-sm">Batch Reconciler Session</p>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex min-h-0">
            <Collection selectedIds={selectedIds} toggleSelection={toggleSelection} />
          </div>
          <div className="shrink-0 flex max-h-[300px] md:max-h-full">
            <BatchReconciler selectedIds={selectedIds} clearSelection={clearSelection} />
          </div>
        </div>

        <div className="shrink-0">
          <ArtifactManager />
        </div>
      </div>
    </div>
  );
}

export default App;
