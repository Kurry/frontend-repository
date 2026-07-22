import React, { useState, useCallback, useRef } from 'react';
import PatternList from './components/PatternList.jsx';
import ForecastRibbon from './components/ForecastRibbon.jsx';
import { exportArtifact, importArtifact } from './utils/artifact.js';

const initialPatterns = [
  { id: 'p1', title: 'Basic Rock Beat', status: 'ready', tempo: 120, forecastRibbonState: null, history: [] },
  { id: 'p2', title: 'Funky Groove', status: 'draft', tempo: 105, forecastRibbonState: null, history: [] },
  { id: 'p3', title: 'Jazz Swing', status: 'archived', tempo: 135, forecastRibbonState: null, history: [] }
];

export default function App() {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddPattern = () => {
    const newId = `p${Date.now()}`;
    setPatterns(prev => [...prev, { id: newId, title: 'New Pattern', status: 'empty', tempo: 120, forecastRibbonState: null, history: [] }]);
    setSelectedPatternId(newId);
  };

  const handleDeletePattern = (id) => {
    setPatterns(prev => prev.filter(p => p.id !== id));
    if (selectedPatternId === id) setSelectedPatternId(null);
  };

  const handleMutatePattern = (id, updates) => {
    setPatterns(prev => prev.map(p => {
      if (p.id !== id) return p;
      const { history, ...currentState } = p;
      return { ...p, ...updates, history: [...history, currentState] };
    }));
  };

  const handleUndoPattern = (id) => {
    setPatterns(prev => prev.map(p => {
      if (p.id !== id || p.history.length === 0) return p;
      const lastState = p.history[p.history.length - 1];
      return { ...lastState, history: p.history.slice(0, -1) };
    }));
  };

  const handleExport = () => exportArtifact(patterns);
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPatterns = importArtifact(event.target.result, patterns);
      if (newPatterns !== patterns) { setPatterns(newPatterns); setSelectedPatternId(null); }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleClear = () => { setPatterns([]); setSelectedPatternId(null); };

  const selectedPattern = patterns.find(p => p.id === selectedPatternId);
  const changedPatternsCount = patterns.filter(p => p.status === 'changed').length;
  const readyPatternsCount = patterns.filter(p => p.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900 font-sans">
      <aside className="w-full md:w-80 border-r border-gray-200 bg-white p-4 flex flex-col h-full overflow-hidden shrink-0">
        <h1 className="text-xl font-bold mb-4">Drum Patterns</h1>
        <div className="flex-1 overflow-hidden">
          <PatternList patterns={patterns} selectedPatternId={selectedPatternId} onSelect={setSelectedPatternId} onAdd={handleAddPattern} onDelete={handleDeletePattern} />
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b border-gray-200 bg-white p-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold">Forecast Ribbon Surface</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium transition-colors">Export</button>
            <button onClick={() => fileInputRef.current.click()} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium transition-colors">Import</button>
            <button onClick={handleClear} className="px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium transition-colors">Clear</button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-md font-medium text-gray-800 mb-4">Selected Pattern</h3>
              {!selectedPatternId ? (
                <p className="text-sm text-gray-600 mb-4">Select a pattern from the sidebar to edit its forecast ribbon.</p>
              ) : selectedPattern ? (
                <div>
                  <div className="mb-6 flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase">Pattern Title</label>
                      <input type="text" value={selectedPattern.title} onChange={(e) => handleMutatePattern(selectedPattern.id, { title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 uppercase">Base Tempo</label>
                      <input type="number" min="60" max="200" value={selectedPattern.tempo} onChange={(e) => handleMutatePattern(selectedPattern.id, { tempo: parseInt(e.target.value, 10) || 60 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                  </div>
                  <ForecastRibbon pattern={selectedPattern} onMutate={handleMutatePattern} onUndo={handleUndoPattern} />
                </div>
              ) : (
                <p className="text-sm text-red-600">Selected pattern not found.</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-md font-medium text-gray-800 mb-4">Derived Global Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded border border-gray-100"><div className="text-2xl font-bold text-gray-900">{patterns.length}</div><div className="text-xs text-gray-500 uppercase mt-1">Total</div></div>
                <div className="p-4 bg-green-50 rounded border border-green-100"><div className="text-2xl font-bold text-green-700">{readyPatternsCount}</div><div className="text-xs text-green-600 uppercase mt-1">Ready</div></div>
                <div className="p-4 bg-blue-50 rounded border border-blue-100"><div className="text-2xl font-bold text-blue-700">{changedPatternsCount}</div><div className="text-xs text-blue-600 uppercase mt-1">Changed</div></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
