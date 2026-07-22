import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Undo, AlertCircle } from 'lucide-react';

export const ScenarioWeaver: React.FC = () => {
  const { records, branchScenario, activeScenario, undo } = useStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [substitute, setSubstitute] = useState('');
  const [ratio, setRatio] = useState('1:1');
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = records.find(r => r.id === selectedId);

  const handleBranch = () => {
    setError(null);
    if (!selectedId) {
      setError('Please select an ingredient.');
      return;
    }
    if (!substitute.trim()) {
      setError('Substitute name is required to branch a scenario.');
      return;
    }
    if (selectedRecord?.status === 'empty') {
      setError('Cannot branch an empty ingredient. Update its status first.');
      return;
    }

    branchScenario(selectedId, substitute, ratio);
    setSubstitute('');
    setRatio('1:1');
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <GitBranch className="text-blue-600" />
          Scenario Weaver
        </h2>
        <button
          onClick={undo}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm bg-white border px-3 py-1.5 rounded shadow-sm transition-colors"
          title="Undo last action (Ctrl+Z)"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Branch New Scenario</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Select Ingredient</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              data-testid="weaver-select"
            >
              <option value="">-- Choose Ingredient --</option>
              {records.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Substitute With</label>
              <input
                type="text"
                value={substitute}
                onChange={e => setSubstitute(e.target.value)}
                placeholder="e.g. Almond Flour"
                className="w-full border rounded px-3 py-2 text-sm"
                data-testid="weaver-substitute"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-slate-500 mb-1">Ratio</label>
              <input
                type="text"
                value={ratio}
                onChange={e => setRatio(e.target.value)}
                placeholder="1:1"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            onClick={handleBranch}
            className="w-full bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-900 transition-colors mt-2"
            data-testid="weaver-branch-btn"
          >
            Branch Scenario
          </button>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Active Scenarios</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {records.filter(r => r['scenario-weaverState'] !== 'idle').map(record => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={record.id}
                className={`p-3 rounded border ${record.id === activeScenario ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-slate-800">{record.name}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="font-medium text-blue-700">{record.substitute}</span>
                  </div>
                  <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded text-slate-500">
                    {record.substituteRatio}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                  <span className="capitalize px-1.5 py-0.5 bg-slate-100 rounded">Status: {record.status}</span>
                  <span className="capitalize px-1.5 py-0.5 bg-slate-100 rounded">State: {record['scenario-weaverState']}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {records.filter(r => r['scenario-weaverState'] !== 'idle').length === 0 && (
             <div className="text-center text-slate-400 py-8 text-sm bg-white rounded border border-dashed border-slate-300">
               No active scenarios.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};