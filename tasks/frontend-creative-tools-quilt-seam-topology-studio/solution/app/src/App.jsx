import React, { useReducer, useState, useEffect, useRef } from 'react';
import { Download, Upload, GitBranch, Play, Clock, Box, LayoutGrid } from 'lucide-react';
import { initialFixture, reducer } from './logic';
import { initWebMCP } from './webmcp';

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, initialFixture);
  const [selectedView, setSelectedView] = useState('canvas');
  const [selectedPiece, setSelectedPiece] = useState(null);
  const importRef = useRef(null);
  const viewRef = useRef(selectedView);

  const stateRef = useRef(state);
  stateRef.current = state;
  viewRef.current = selectedView;

  useEffect(() => {
    initWebMCP(() => stateRef.current, dispatch, {
      select: (type, value) => {
        if (type === 'piece') { setSelectedPiece(value); setSelectedView('canvas'); }
        if (type === 'seam') setSelectedView('topology');
      },
      switchMode: mode => setSelectedView({ geometry: 'canvas', fabric: 'nesting', proof: 'issues' }[mode] || mode),
      mode: () => viewRef.current,
      exportArtifact: format => handleExport({
        'quilt-project-json': 'json', 'piece-manifest-csv': 'csv', 'templates-svg': 'svg',
        'assembly-plan-json': 'assembly-json', 'maker-notes-md': 'md'
      }[format]),
      openImport: () => importRef.current?.click(),
      copyProject: () => navigator.clipboard?.writeText(JSON.stringify(stateRef.current, null, 2)),
    });
  }, []);

  const handleExport = (format) => {
    let content = "";
    let mime = "text/plain";
    let ext = "txt";

    if (format === 'json') {
      content = JSON.stringify(state, null, 2);
      mime = "application/json";
      ext = "json";
    } else if (format === 'csv') {
      content = "id,blockId,lotId,grain\n" + state.pieces.map(p => `${p.id},${p.blockId},${p.lotId},${p.grain}`).join('\n');
      mime = "text/csv";
      ext = "csv";
    } else if (format === 'svg') {
      content = `<svg xmlns="http://www.w3.org/2000/svg">` + state.pieces.map(p =>
        `<g transform="translate(${p.transform.x}, ${p.transform.y})"><rect width="10" height="10" fill="gray" /></g>`
      ).join('') + `</svg>`;
      mime = "image/svg+xml";
      ext = "svg";
    } else if (format === 'assembly-json') {
      content = JSON.stringify({ revision: state.revisions, groups: state.assemblyGroups }, null, 2);
      mime = "application/json";
      ext = "assembly.json";
    } else if (format === 'md') {
      content = `# Maker Notes\nRevisions: ${state.revisions}\nProofs: ${state.proofs.length}`;
      mime = "text/markdown";
      ext = "md";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const payload = JSON.parse(evt.target.result);
          dispatch({ type: 'IMPORT', payload });
        } catch (e) {
          alert('Invalid JSON import');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-indigo-700">
          <LayoutGrid size={20} className="text-indigo-500" />
          <span>Quilt Seam Topology Studio</span>
        </div>
        <nav className="flex gap-1">
          {['canvas', 'topology', 'nesting', 'assembly', 'issues'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedView === view
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 shadow-sm transition-all cursor-pointer">
            <Upload size={14} /> Import
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 text-white shadow-sm transition-all">
              <Download size={14} /> Export
            </button>
            <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow hidden group-hover:block w-32 z-50 text-sm">
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleExport('json')}>Project JSON</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleExport('csv')}>Manifest CSV</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleExport('svg')}>Templates SVG</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleExport('md')}>Maker Notes</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => navigator.clipboard?.writeText(JSON.stringify(state, null, 2))}>Copy Project JSON</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        <aside className="w-64 bg-white border-r flex flex-col shrink-0 overflow-y-auto">
           <div className="p-4 border-b">
             <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Status</h2>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between items-center"><span className="text-gray-600">Blocks</span> <span className="font-medium tabular-nums">48</span></div>
               <div className="flex justify-between items-center"><span className="text-gray-600">Pieces</span> <span className="font-medium tabular-nums">{state.pieces.length}</span></div>
               <div className="flex justify-between items-center"><span className="text-gray-600">Seam Families</span> <span className="font-medium tabular-nums">{state.seams.length}</span></div>
               <div className="flex justify-between items-center"><span className="text-gray-600">Fabric Lots</span> <span className="font-medium tabular-nums">{state.lots.length}</span></div>
               <div className="flex justify-between items-center"><span className="text-gray-600">Assembly Groups</span> <span className="font-medium tabular-nums">{state.assemblyGroups.length}</span></div>
             </div>
           </div>

           <div className="p-4 border-b">
             <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 justify-between">
               <span className="flex items-center gap-2"><GitBranch size={14} /> Branches</span>
               <button onClick={() => dispatch({ type: 'PROOF' })} className="text-xs bg-gray-200 px-2 py-0.5 rounded hover:bg-gray-300">Proof</button>
             </h2>
             <div className="bg-gray-50 rounded p-3 text-sm mb-2 border border-gray-100">
                <div className="font-medium text-gray-700 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> {state.branches[state.activeBranch].name}
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Rev: <span className="font-mono">{state.revisions}</span></span>
                  {state.isStale ? (
                    <span className="text-red-600">Stale</span>
                  ) : (
                    <span className="text-indigo-600">Proofed</span>
                  )}
                </div>
             </div>
           </div>

           <div className="p-4 flex-1">
             <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               <Clock size={14} /> Assembly Clock
             </h2>
             <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (state.clock / state.assemblyGroups.length) * 100)}%`}}></div>
                </div>
             </div>
             <div className="mt-2 text-xs text-center text-gray-500">
                Step {state.clock} completed
             </div>
           </div>
        </aside>

        <section className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative bg-white m-4 border rounded-xl shadow-inner min-h-0">
             {selectedView === 'canvas' && (
                 <svg width="2000" height="2000" className="absolute top-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')]">
                    {state.pieces.map(p => (
                       <g key={p.id}
                          transform={`translate(${p.transform.x}, ${p.transform.y}) rotate(${p.transform.r})`}
                          onClick={() => setSelectedPiece(p)}
                          className="cursor-pointer hover:opacity-75 transition-opacity"
                       >
                         <polygon
                           points={p.cutVertices.map(v=>`${v.x},${v.y}`).join(' ')}
                           fill="none" stroke="#ccc" strokeWidth="1" strokeDasharray="2"
                         />
                         <polygon
                           points={p.finishedVertices.map(v=>`${v.x},${v.y}`).join(' ')}
                           fill={selectedPiece?.id === p.id ? "#818cf8" : (p.mismatch ? "#fca5a5" : "#e0e7ff")}
                           stroke="#4f46e5" strokeWidth="1"
                         />
                       </g>
                    ))}
                 </svg>
             )}

             {selectedView === 'nesting' && (
                 <div className="p-8 grid grid-cols-2 gap-8">
                     {state.lots.map(l => (
                        <div key={l.id} className="border-2 border-dashed border-gray-400 p-4 rounded-lg bg-gray-50">
                           <h3 className="font-semibold text-sm mb-2">{l.name}</h3>
                           <div className="text-xs text-gray-500 mb-2">Used: {l.used} / {l.area} ({Math.round(l.used/l.area*100)}%)</div>
                           <div className="relative w-full h-32 bg-white border">
                               {state.pieces.filter(p => p.lotId === l.id).map((p, idx) => (
                                   <div key={p.id} className="absolute w-4 h-4 bg-indigo-500 rounded-sm opacity-50 border border-white"
                                        style={{ left: `${(idx % 15) * 5}%`, top: `${Math.floor(idx/15)*15}%` }}
                                        title={p.id}
                                   ></div>
                               ))}
                           </div>
                        </div>
                     ))}
                 </div>
             )}

             {selectedView === 'assembly' && (
                 <div className="p-8 space-y-2">
                     {state.assemblyGroups.map(ag => (
                         <div key={ag.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                             <div>
                                 <div className="font-medium text-sm">{ag.id} (Step {ag.step})</div>
                                 <div className="text-xs text-gray-500">Seams: {ag.seams.length} | Deps: {ag.dependencies.length}</div>
                             </div>
                             <div className="flex gap-2">
                                <button className="px-3 py-1 bg-green-500 text-white text-xs rounded" onClick={() => dispatch({ type: 'COMPLETE_JOIN', seamId: ag.seams[0] })}>Complete Step</button>
                                <button className="px-3 py-1 bg-amber-500 text-white text-xs rounded" onClick={() => dispatch({ type: 'UNPICK_JOIN', seamId: ag.seams[0] })}>Unpick Step</button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             {selectedView === 'topology' && (
                 <div className="p-8 h-[2000px] w-[2000px] relative">
                     <svg width="100%" height="100%" className="absolute inset-0">
                         {state.seams.map((s) => {
                             const p1 = state.pieces.find(p => p.id === s.p1);
                             const p2 = state.pieces.find(p => p.id === s.p2);
                             if (!p1 || !p2) return null;
                             return <line key={s.id} x1={p1.transform.x + 7.5} y1={p1.transform.y + 7.5} x2={p2.transform.x + 7.5} y2={p2.transform.y + 7.5} stroke={s.completed ? "#10b981" : "#94a3b8"} strokeWidth={s.completed ? 3 : 1.5} strokeDasharray={s.completed ? "none" : "4 2"} />;
                         })}
                     </svg>
                     {state.pieces.map(p => (
                         <div key={p.id} className="absolute w-3 h-3 bg-white border-2 border-indigo-500 rounded-full" style={{ left: p.transform.x + 6, top: p.transform.y + 6 }}></div>
                     ))}
                 </div>
             )}

             {selectedView === 'issues' && (
                 <div className="p-8">
                     <h2 className="text-lg font-bold mb-4">Mismatches & Issues</h2>
                     <ul className="space-y-2">
                        {state.pieces.filter(p => p.mismatch).map(p => (
                            <li key={p.id} className="text-sm p-3 bg-red-50 text-red-700 border border-red-200 rounded">
                                Seeded mismatch found in <strong>{p.id}</strong>. Geometry conflict in lot mapping.
                            </li>
                        ))}
                        {state.lots.filter(l => l.used >= l.area).map(l => (
                            <li key={l.id} className="text-sm p-3 bg-orange-50 text-orange-700 border border-orange-200 rounded">
                                Lot <strong>{l.name}</strong> exhausted. Area usage: {l.used}/{l.area}.
                            </li>
                        ))}
                     </ul>
                 </div>
             )}
          </div>

          <div className="h-48 border-t bg-white flex shrink-0">
             <div className="w-1/2 border-r p-3 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Properties</h3>
                {selectedPiece ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                       <div className="text-gray-500">Selected</div>
                       <div className="font-medium text-gray-900">{selectedPiece.id}</div>
                       <div className="text-gray-500">Type</div>
                       <div className="font-medium text-gray-900">{selectedPiece.type}</div>
                       <div className="text-gray-500">Lot Assignment</div>
                       <div className="font-medium text-gray-900">{selectedPiece.lotId}</div>
                       <div className="text-gray-500">Position X/Y</div>
                       <div className="font-medium text-gray-900">{selectedPiece.transform.x} / {selectedPiece.transform.y}</div>
                       <div className="text-gray-500">Actions</div>
                       <div>
                          <button onClick={() => dispatch({type: 'TRANSFORM_PIECE', pieceId: selectedPiece.id, transform: {x: selectedPiece.transform.x + 10}})} className="px-2 py-1 bg-gray-200 rounded text-xs">Translate X+10</button>
                       </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 mt-4 text-center">Select a piece in Canvas view to inspect properties.</div>
                )}
             </div>
             <div className="w-1/2 p-3 overflow-y-auto bg-gray-50/50">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Event Log</h3>
                <ul className="space-y-1 text-xs font-mono text-gray-600">
                   {state.events.slice(-10).map((e, idx) => (
                       <li key={idx}>
                         <span className="text-gray-400">[Clk: {e.time}]</span> {e.type} on {e.seamId}
                       </li>
                   ))}
                   {state.events.length === 0 && <li className="text-gray-400 italic">No events recorded.</li>}
                </ul>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
