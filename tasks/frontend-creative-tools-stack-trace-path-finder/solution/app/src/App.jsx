import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { Save, Download, Copy, Play, SkipForward } from 'lucide-react';

function App() {
  const store = useStore();

  useEffect(() => {
    // Initial mount behavior: trigger trace parse if not done
    if (store.frames.length === 0) {
      store.setRawTrace(store.rawTrace);
    }
  }, []);

  const handleExport = async (format) => {
    const pack = {
      schemaVersion: "stack-path-hypothesis/v1",
      exportedAt: new Date().toISOString(),
      rawTraceText: store.rawTrace,
      frames: store.frames,
      path: store.path,
      hypotheses: store.hypotheses,
    };

    const text = JSON.stringify(pack, null, 2);

    if (format === 'copy') {
      try {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      } catch(e) {
        // Fallback for playwright test environment without clipboard permission
        console.error("Clipboard copy failed", e);
      }
    } else {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hypothesis-${Date.now()}.json`;
      a.click();
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.schemaVersion === "stack-path-hypothesis/v1") {
          store.importSession(data);
        }
      } catch (e) {
        alert("Invalid format");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-hidden">
      <header className="flex justify-between items-center pb-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Stack-Trace Path Finder</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-1" onClick={() => handleExport('copy')}>
            <Copy size={16} /> Copy
          </button>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-1" onClick={() => handleExport('download')}>
            <Download size={16} /> Download
          </button>
          <label className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded cursor-pointer">
            Import
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 mt-4 gap-4 overflow-hidden">
        {/* Left Column: Trace Input & Frames */}
        <div className="flex flex-col w-1/3 border-r border-gray-700 pr-4">
          <textarea
            className="w-full h-32 bg-gray-800 p-2 border border-gray-600 rounded text-xs mb-4"
            value={store.rawTrace}
            onChange={(e) => store.setRawTrace(e.target.value)}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 pb-10">
            {store.frames.map((frame, idx) => (
              <div key={frame.id} className={`p-2 border rounded ${frame.type === 'noise' ? 'bg-gray-800 border-gray-600 text-gray-400' : frame.type === 'unresolved' ? 'bg-red-900/30 border-red-700' : 'bg-gray-800 border-gray-500'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">{frame.id} ({frame.type})</span>
                  {frame.type === 'frame' && (
                    <button className="text-xs bg-gray-700 px-1 rounded hover:bg-gray-600" onClick={() => store.updateFrame(frame.id, { collapsed: !frame.collapsed })}>
                      {frame.collapsed ? 'Expand' : 'Collapse'}
                    </button>
                  )}
                </div>
                <div className="text-xs break-words">{frame.text}</div>
                {frame.candidates && frame.candidates.length > 0 && !frame.collapsed && (
                  <div className="mt-2 pl-2 border-l border-blue-500">
                    <div className="text-[10px] text-gray-400">Candidates:</div>
                    {frame.candidates.map(c => (
                      <div key={c.id} className="flex justify-between items-center py-1">
                        <span className={`text-xs ${frame.mappedNode === c.id ? 'text-green-400' : ''}`}>{c.basename} : {c.symbol}</span>
                        <button
                          className={`text-[10px] px-1 rounded ${frame.mappedNode === c.id ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                          onClick={() => store.mapCandidate(frame.id, frame.mappedNode === c.id ? null : c.id)}
                        >
                          {frame.mappedNode === c.id ? 'Mapped' : 'Map'}
                        </button>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px]">Weight:</span>
                      <input type="range" min="0" max="100" value={frame.weight} className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" onChange={(e) => store.updateFrame(frame.id, { weight: parseInt(e.target.value) })}/>
                      <span className="text-[10px]">{frame.weight}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Path & Graph */}
        <div className="flex flex-col flex-1 pl-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">Graph Route</h2>
            {store.valid ? (
              <div className="p-2 bg-green-900/20 border border-green-700 rounded text-green-400">
                Valid Path: {store.path.length > 0 ? store.path.join(" -> ") : "No mappings"}
              </div>
            ) : (
              <div className="p-2 bg-red-900/20 border border-red-700 rounded text-red-400">
                Invalid Path
                <ul className="list-disc pl-4 mt-1 text-xs">
                  {store.contradictions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex-1 bg-gray-800 border border-gray-700 rounded p-4 overflow-y-auto">
             <h3 className="font-bold mb-2">Source Excerpts</h3>
             <div className="space-y-4">
               {store.graph.excerpts.filter(e => store.path.includes(e.node)).map(e => (
                 <div key={e.id} className="p-2 bg-gray-900 rounded border border-gray-700">
                   <div className="text-xs text-gray-400 mb-1">{e.node} (Line {e.offset})</div>
                   <pre className="text-xs text-green-300">{e.text}</pre>
                 </div>
               ))}
               {store.path.length === 0 && <div className="text-gray-500 text-xs">Map candidates to see source trace...</div>}
             </div>
          </div>

          {/* Hypotheses */}
          <div className="mt-4 pt-4 border-t border-gray-700">
             <h3 className="font-bold mb-2 flex justify-between">
               Hypotheses
               <button className="text-xs bg-blue-600 px-2 py-1 rounded" onClick={() => {
                 const name = prompt("Hypothesis name:");
                 if(name) store.saveHypothesis(name);
               }}>Save Current</button>
             </h3>
             <div className="flex gap-2">
               {store.hypotheses.map(h => (
                 <div key={h.id} className={`p-2 border rounded text-xs cursor-pointer ${store.activeHypothesisId === h.id ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 hover:bg-gray-800'}`} onClick={() => store.loadHypothesis(h.id)}>
                   {h.name}
                 </div>
               ))}
               {store.hypotheses.length === 0 && <div className="text-xs text-gray-500">No hypotheses saved.</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
