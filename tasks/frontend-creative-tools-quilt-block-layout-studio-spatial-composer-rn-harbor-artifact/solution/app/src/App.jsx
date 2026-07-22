import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store.js';
import { motion } from 'framer-motion';

export default function App() {
  const {
      records, addRecord, updateRecord, deleteRecord,
      spatialComposerState, selectRecordForPlacement, placeRecord, undo,
      derived, clearSession, importArtifact
  } = useStore();

  const [filter, setFilter] = useState('all');
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockWidth, setNewBlockWidth] = useState(10);
  const [newBlockHeight, setNewBlockHeight] = useState(10);
  const [exportError, setExportError] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  // Keyboard shortcut for Undo (Cmd/Ctrl + Z)
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

  const handleAddBlock = (e) => {
    e.preventDefault();
    if (!newBlockName) return;

    addRecord({
      id: `block-${Date.now()}`,
      name: newBlockName,
      status: 'draft',
      defaultWidth: newBlockWidth,
      defaultHeight: newBlockHeight
    });
    setNewBlockName('');
    // Update derived total
    useStore.setState(state => ({
        derived: {
            ...state.derived,
            summary: {
                ...state.derived.summary,
                totalBlocks: state.records.length
            }
        }
    }));
  };

  const handleExport = () => {
    const data = {
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records,
        spatialComposerState,
        derived,
        history: useStore.getState().history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target.result);
              if (data.schemaVersion !== 'v1') {
                  setImportError('Invalid schemaVersion. Expected v1.');
                  return;
              }
              const ids = new Set();
              for (let r of (data.records || [])) {
                  if (ids.has(r.id)) {
                      setImportError('Duplicate record IDs found.');
                      return;
                  }
                  ids.add(r.id);
              }

              setImportError('');
              importArtifact(data);
          } catch (err) {
              setImportError('Malformed JSON.');
          }
      };
      reader.readAsText(file);
      e.target.value = null; // reset
  };

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  // Accessibility & reduced motion handling
  const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col md:flex-row">

      {/* Sidebar: Quilt Blocks Collection */}
      <aside className="w-full md:w-80 bg-white border-r border-neutral-200 flex flex-col h-auto md:h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b border-neutral-200">
            <h1 className="text-xl font-semibold mb-4 text-neutral-800">Quilt Blocks</h1>

            <form onSubmit={handleAddBlock} className="flex flex-col gap-2 mb-4" aria-label="Add new block">
                <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="Block name"
                    className="border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Block name"
                    required
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={newBlockWidth}
                        onChange={(e) => setNewBlockWidth(Number(e.target.value))}
                        className="border border-neutral-300 rounded px-3 py-2 text-sm w-1/2"
                        placeholder="Width"
                        min="1" max="100"
                        aria-label="Block width"
                    />
                    <input
                        type="number"
                        value={newBlockHeight}
                        onChange={(e) => setNewBlockHeight(Number(e.target.value))}
                        className="border border-neutral-300 rounded px-3 py-2 text-sm w-1/2"
                        placeholder="Height"
                        min="1" max="100"
                        aria-label="Block height"
                    />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors">
                    Add Block
                </button>
            </form>

            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter blocks"
            >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
            </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list" aria-label="Block collection">
            {filteredRecords.length === 0 && (
                <div className="text-sm text-neutral-500 italic">No blocks found.</div>
            )}
            {filteredRecords.map(record => (
                <div key={record.id} className="border border-neutral-200 rounded p-3 bg-white shadow-sm hover:border-neutral-300 transition-colors" role="listitem">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{record.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            record.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            record.status === 'ready' ? 'bg-green-100 text-green-700' :
                            record.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                            'bg-neutral-100 text-neutral-700'
                        }`}>
                            {record.status}
                        </span>
                    </div>
                    <div className="text-xs text-neutral-500 mb-3">
                        Size: {record.defaultWidth} x {record.defaultHeight}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => selectRecordForPlacement(record.id)}
                            className="text-xs bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded font-medium flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            aria-label={`Select ${record.name} for placement`}
                        >
                            Select
                        </button>
                        <button
                            onClick={() => updateRecord(record.id, { status: record.status === 'archived' ? 'draft' : 'archived' })}
                            className="text-xs text-neutral-500 hover:text-neutral-800 px-2 outline-none focus:ring-2 focus:ring-neutral-500 rounded"
                            aria-label={`${record.status === 'archived' ? 'Restore' : 'Archive'} ${record.name}`}
                        >
                            {record.status === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                        <button
                            onClick={() => deleteRecord(record.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 outline-none focus:ring-2 focus:ring-red-500 rounded"
                            aria-label={`Delete ${record.name}`}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </aside>

      {/* Main Canvas: Spatial Composer */}
      <main className="flex-1 flex flex-col relative h-[50vh] md:h-screen">
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-medium">Spatial Composer</h2>
            <div className="flex items-center gap-4">
                <button
                    onClick={undo}
                    disabled={useStore.getState().history.length === 0}
                    className="text-sm px-3 py-1.5 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-neutral-500 outline-none transition-colors"
                    aria-label="Undo last action"
                >
                    Undo (Cmd+Z)
                </button>
            </div>
        </header>

        <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 bg-neutral-100 overflow-hidden">

            {/* Canvas Area */}
            <div className="flex-1 flex justify-center items-center h-full">
                <div
                    className={`relative bg-white border-2 shadow-sm ${spatialComposerState.status === 'conflict' ? 'border-red-400 shadow-red-100' : 'border-neutral-300'} transition-all`}
                    style={{ width: '400px', height: '400px' }} // Scale 4x for 100x100 virtual units
                    aria-label="Composer canvas"
                    role="application"
                >
                    {/* Grid background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                         style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    {/* Placed blocks */}
                    {spatialComposerState.placedRecords.map(p => {
                        const rec = records.find(r => r.id === p.id);
                        return (
                            <motion.div
                                key={p.id}
                                layout={!isReducedMotion}
                                initial={!isReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                                animate={!isReducedMotion ? { opacity: 1, scale: 1 } : false}
                                className={`absolute flex items-center justify-center text-xs font-medium text-white shadow-md overflow-hidden ${p.isConflict ? 'bg-red-500' : 'bg-blue-600'}`}
                                style={{
                                    left: `${p.x * 4}px`,
                                    top: `${p.y * 4}px`,
                                    width: `${p.width * 4}px`,
                                    height: `${p.height * 4}px`,
                                }}
                                title={rec?.name}
                            >
                                <span className="truncate px-1">{rec?.name}</span>
                            </motion.div>
                        );
                    })}

                    {/* Active Placement Tools if Selected */}
                    {spatialComposerState.selectedId && (() => {
                        const selectedRec = records.find(r => r.id === spatialComposerState.selectedId);
                        if (!selectedRec) return null;

                        return (
                            <div className="absolute inset-0 bg-black/5 z-20 flex flex-col items-center justify-center">
                                <div className="bg-white p-4 rounded shadow-lg flex flex-col gap-3 pointer-events-auto border border-blue-200">
                                    <div className="text-sm font-medium mb-1">Place: {selectedRec.name}</div>
                                    <form
                                        className="flex gap-2 items-center"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.target);
                                            placeRecord(
                                                selectedRec.id,
                                                Number(fd.get('x')),
                                                Number(fd.get('y')),
                                                selectedRec.defaultWidth,
                                                selectedRec.defaultHeight
                                            );
                                        }}
                                        aria-label="Placement coordinates"
                                    >
                                        <input type="number" name="x" placeholder="X" required min="0" max="100" className="w-16 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" aria-label="X coordinate"/>
                                        <input type="number" name="y" placeholder="Y" required min="0" max="100" className="w-16 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" aria-label="Y coordinate"/>
                                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 outline-none">Place</button>
                                    </form>
                                    {spatialComposerState.status === 'conflict' && (
                                        <div className="text-red-500 text-xs font-medium" role="alert">Conflict or out of bounds! Invalid mutation rejected.</div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Derived Summary & Artifact Panel */}
            <div className="w-full md:w-64 flex flex-col gap-4">
                <div className="bg-white border border-neutral-200 rounded shadow-sm p-4" aria-live="polite">
                    <h3 className="font-semibold text-sm mb-3 text-neutral-800 border-b pb-2">Derived Summary</h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-neutral-500">Total Blocks:</dt>
                            <dd className="font-medium">{derived.summary.totalBlocks}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-neutral-500">Used Capacity:</dt>
                            <dd className="font-medium">{derived.summary.usedCapacity}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-neutral-500">Remaining:</dt>
                            <dd className="font-medium text-blue-600">{derived.summary.remainingCapacity}</dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-white border border-neutral-200 rounded shadow-sm p-4">
                    <h3 className="font-semibold text-sm mb-3 text-neutral-800 border-b pb-2">Portable Artifact</h3>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleExport}
                            className="w-full bg-neutral-800 text-white text-sm py-2 rounded hover:bg-neutral-900 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-neutral-900 outline-none"
                            aria-label="Export artifact"
                        >
                            Export Artifact
                        </button>

                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={clearSession}
                                className="flex-1 border border-neutral-300 text-neutral-700 text-sm py-1.5 rounded hover:bg-neutral-50 transition-colors focus:ring-2 focus:ring-neutral-500 outline-none"
                                aria-label="Clear session"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 border border-neutral-300 text-neutral-700 text-sm py-1.5 rounded hover:bg-neutral-50 transition-colors focus:ring-2 focus:ring-neutral-500 outline-none"
                                aria-label="Import artifact"
                            >
                                Import
                            </button>
                            <input
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleImport}
                                className="hidden"
                                aria-hidden="true"
                            />
                        </div>

                        {importError && (
                            <div className="text-red-500 text-xs mt-2" role="alert">{importError}</div>
                        )}
                        {exportError && (
                            <div className="text-red-500 text-xs mt-2" role="alert">{exportError}</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
