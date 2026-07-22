import { useState, useRef } from 'react';
import { useStore, useDerivedState, type PolicyState } from '../store';

export function Controls() {
  const policy = useStore(state => state.policy);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const historyIndex = useStore(state => state.historyIndex);
  const history = useStore(state => state.history);
  const setPressure = useStore(state => state.setPressure);
  const addCheckpoint = useStore(state => state.addCheckpoint);
  const setComparison = useStore(state => state.setComparison);
  const exportPolicy = useStore(state => state.exportPolicy);
  const importPolicy = useStore(state => state.importPolicy);

  const { costs } = useDerivedState(policy);
  const overconstrained = Object.keys(costs).some(k => costs[k] > policy.allocations[k]);

  const [checkpointName, setCheckpointName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportPolicy();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReasoningBudgetPolicy-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.schemaVersion === 'reasoning-budget-policy/v1') {
          importPolicy(data as PolicyState);
        } else {
          alert('Invalid policy schema version');
        }
      } catch (err) {
        alert('Failed to parse policy file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-3 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">History</label>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="px-3 py-1.5 bg-slate-100 rounded text-sm disabled:opacity-50 hover:bg-slate-200"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="px-3 py-1.5 bg-slate-100 rounded text-sm disabled:opacity-50 hover:bg-slate-200"
          >
            Redo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">Pressure Test</label>
        <select
          value={policy.pressure}
          onChange={(e) => setPressure(e.target.value as any)}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white min-w-[150px]"
        >
          <option value="none">Normal (24k)</option>
          <option value="context18k">Reduce Cap to 18k</option>
          <option value="min-increase">Increase Min Bounds</option>
          <option value="new-anchor">Add Protected Anchor</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">Checkpoints</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Name..."
            value={checkpointName}
            onChange={(e) => setCheckpointName(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-24"
            maxLength={40}
          />
          <button
            onClick={() => { if(checkpointName) { addCheckpoint(checkpointName); setCheckpointName(''); } }}
            className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200"
          >
            Save
          </button>
          <select
            value={policy.comparison || ''}
            onChange={(e) => setComparison(e.target.value || null)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white"
          >
            <option value="">No Compare</option>
            {policy.checkpoints.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1 ml-auto">
        <label className="text-xs font-semibold text-slate-500">Transfer</label>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 rounded text-sm hover:bg-slate-200">
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={overconstrained}
            title={overconstrained ? "Cannot export overconstrained policy" : "Export Policy JSON"}
          >
            Export Certified
          </button>
        </div>
      </div>
    </div>
  );
}
