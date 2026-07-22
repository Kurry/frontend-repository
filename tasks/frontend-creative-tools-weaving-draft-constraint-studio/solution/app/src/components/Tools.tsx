import { useState, useRef } from 'react';
import { useWeavingStore } from '../store';
import { FIXTURE_YARN_LOTS, YarnColor } from '../types';
import { exportSessionJSON, exportCSV, exportSVG, generateWIF } from '../artifacts';

export function ColorPalette({ store, type }: { store: ReturnType<typeof useWeavingStore>, type: 'warp' | 'weft' }) {
  const { state, dispatch } = store;
  const [activeColor, setActiveColor] = useState<YarnColor>('black');
  const length = type === 'warp' ? state.dimensions.ends : state.dimensions.picks;
  const colors = type === 'warp' ? state.warpColors : state.weftColors;

  return (
    <div className="flex flex-col mt-4">
      <h3 className="text-sm font-semibold mb-2 capitalize">{type} Colors (Lots & Estimates)</h3>
      <div className="text-xs mb-2 text-gray-500">Note: Estimation assumes standard density/waste formulas</div>
      <div className="flex gap-2 mb-2">
         {FIXTURE_YARN_LOTS.map(c => (
           <div
             key={c}
             onClick={() => setActiveColor(c)}
             className={`w-6 h-6 border cursor-pointer ${activeColor === c ? 'border-4 border-blue-500' : 'border-gray-300'}`}
             style={{ backgroundColor: c }}
           ></div>
         ))}
      </div>
      <div className="flex flex-wrap gap-0 w-[480px]">
        {Array.from({ length }).map((_, idx) => (
           <div
             key={`${type}-${idx}`}
             onClick={() => dispatch({ type: type === 'warp' ? 'SET_WARP_COLOR' : 'SET_WEFT_COLOR', index: idx, color: activeColor })}
             className="w-4 h-4 border cursor-pointer"
             style={{ backgroundColor: colors[idx] }}
           ></div>
        ))}
      </div>
    </div>
  );
}

export function VariantManager({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;
  const [newVariantName, setNewVariantName] = useState("");

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Variant Branches</h3>
      <div className="flex gap-2 mb-4">
        <input
          className="border p-1 text-sm flex-1"
          placeholder="New branch name..."
          value={newVariantName}
          onChange={e => setNewVariantName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          onClick={() => {
            dispatch({ type: 'BRANCH_VARIANT', name: newVariantName || 'Unnamed' });
            setNewVariantName('');
          }}
        >
          Fork
        </button>
      </div>
      <ul className="space-y-2">
        {state.variants.map(v => (
          <li key={v.id} className="flex justify-between items-center text-sm border-b pb-1">
             <span>{v.name} {state.activeVariantId === v.id ? '(Active)' : ''}</span>
             <div>
                <button onClick={() => dispatch({ type: 'SWITCH_VARIANT', id: v.id })} className="text-blue-500 hover:underline mr-2">Compare/Switch</button>
                <button onClick={() => dispatch({ type: 'MERGE_VARIANT', id: v.id })} className="text-green-600 hover:underline">Merge</button>
             </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValidationPanel({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { validation } = store;

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded shadow-sm max-h-64 overflow-auto">
      <h3 className="text-sm font-semibold mb-4 text-red-600">Structural Validation ({validation.length} findings)</h3>
      {validation.length === 0 ? (
         <div className="text-sm text-gray-500">No issues found.</div>
      ) : (
        <ul className="space-y-2">
           {validation.map((v, i) => (
             <li key={i} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                <strong>{v.type}</strong>: {v.message}
             </li>
           ))}
        </ul>
      )}
    </div>
  )
}

export function SimulationPanel({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;
  const currentPick = state.simulation ? state.simulation.currentPick : 0;

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded shadow-sm">
       <h3 className="text-sm font-semibold mb-4">Simulation & Recovery</h3>
       <div className="text-sm mb-4">Current Pick: {currentPick} / {state.dimensions.picks}</div>
       <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={() => dispatch({ type: 'SIMULATE_UNWEAVE' })} disabled={currentPick <= 0} className="bg-gray-200 px-3 py-1 rounded text-sm disabled:opacity-50">Unweave</button>
            <button onClick={() => dispatch({ type: 'SIMULATE_PICK' })} disabled={currentPick >= state.dimensions.picks} className="bg-gray-200 px-3 py-1 rounded text-sm disabled:opacity-50">Pick</button>
          </div>
          <div className="flex gap-2 mt-2">
             <button onClick={() => dispatch({ type: 'SIMULATE_ERROR', errorType: 'wrong_treadle' })} className="border border-red-300 text-red-600 px-2 py-1 rounded text-xs">Simulate Wrong Treadle</button>
             <button onClick={() => dispatch({ type: 'SIMULATE_ERROR', errorType: 'wrong_color' })} className="border border-red-300 text-red-600 px-2 py-1 rounded text-xs">Simulate Wrong Color</button>
          </div>
          {state.simulation && state.simulation.events.slice(-1)[0]?.event !== 'pick' && (
             <div className="bg-red-50 text-red-800 p-2 text-xs rounded mt-2">
                 Simulation error occurred. <button onClick={() => dispatch({ type: 'SIMULATE_UNWEAVE' })} className="underline font-bold">Unweave and fix</button>
             </div>
          )}
       </div>
    </div>
  )
}

export function ArtifactsPanel({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const json = exportSessionJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weaving-session.json';
    a.click();
  };

  const handleExportCSV = () => {
    const csv = exportCSV(state);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weaving-yarn.csv';
    a.click();
  };

  const handleExportSVG = () => {
    const svg = exportSVG(state);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weaving-draft.svg';
    a.click();
  };

  const handleExportWIF = () => {
    const wif = generateWIF(state);
    const blob = new Blob([wif], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weaving-draft.wif';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onload = (e) => {
         try {
           const json = JSON.parse(e.target?.result as string);
           dispatch({ type: 'IMPORT_STATE', state: json });
         } catch (err) {
           console.error("Failed to parse JSON");
         }
       };
       reader.readAsText(file);
     }
  };

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Export/Import Artifacts</h3>
      <div className="flex gap-2 mb-4">
        <button onClick={handleExportJSON} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">JSON</button>
        <button onClick={handleExportCSV} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">CSV</button>
        <button onClick={handleExportSVG} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">SVG</button>
        <button onClick={handleExportWIF} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">WIF</button>
      </div>
      <div>
         <input type="file" accept="application/json" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
         <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 w-full" onClick={() => fileInputRef.current?.click()}>Import JSON State</button>
      </div>
    </div>
  );
}
