import React, { useState } from 'react';
import { useStore, getDerivedState } from '../store';
import { Undo2, Save, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ForecastRibbon: React.FC = () => {
  const { records, selectedId, mutateSelectedOnRibbon, undo } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);
  const derivedState = getDerivedState(records);

  const [substituteInput, setSubstituteInput] = useState('');
  const [substituteAmount, setSubstituteAmount] = useState<number | ''>('');
  const [substituteUnit, setSubstituteUnit] = useState('cup');

  // React to selection changes
  React.useEffect(() => {
    if (selectedRecord) {
      setSubstituteInput(selectedRecord.substitute || '');
      setSubstituteAmount(selectedRecord.substituteAmount || '');
      setSubstituteUnit(selectedRecord.substituteUnit || 'cup');
    }
  }, [selectedId, selectedRecord?.substitute, selectedRecord?.substituteAmount, selectedRecord?.substituteUnit]);

  const handleMutate = () => {
    if (!selectedRecord) return;

    // Bounds check example
    if (substituteAmount !== '' && (substituteAmount < 0 || substituteAmount > 100)) {
       alert('Amount out of range');
       return;
    }

    mutateSelectedOnRibbon({
      substitute: substituteInput,
      substituteAmount: substituteAmount === '' ? undefined : Number(substituteAmount),
      substituteUnit: substituteUnit
    });
  };

  const handleClear = () => {
    setSubstituteInput('');
    setSubstituteAmount('');
    mutateSelectedOnRibbon({
      substitute: undefined,
      substituteAmount: undefined,
      substituteUnit: undefined,
      status: 'ready'
    });
  };

  if (!selectedRecord) {
    return (
      <div className="w-full h-48 bg-slate-50 border-b border-slate-200 flex flex-col items-center justify-center text-slate-400">
        <p>Select an ingredient to forecast substitutions</p>
      </div>
    );
  }

  const isChanged = selectedRecord.status === 'changed';

  return (
    <div className="w-full bg-white border-b border-slate-200 p-6 flex flex-col shadow-sm relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Forecast Ribbon</h2>
          <p className="text-sm text-slate-500">Adjust substitution for: <span className="font-medium text-slate-700">{selectedRecord.name}</span></p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} /> Undo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Editor side */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Substitute Ingredient</label>
              <input
                type="text"
                value={substituteInput}
                onChange={(e) => setSubstituteInput(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Almond Flour"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                value={substituteAmount}
                onChange={(e) => setSubstituteAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                max="100"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
              <select
                value={substituteUnit}
                onChange={(e) => setSubstituteUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="g">g</option>
                <option value="oz">oz</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMutate}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save size={16} /> Apply Forecast
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
            >
              <XCircle size={16} /> Clear Sub
            </button>
          </div>
        </div>

        {/* Projected Outcomes side */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Projected Outcomes</h3>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedRecord.id + selectedRecord.status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-between items-center bg-white p-3 rounded border border-slate-100 shadow-sm mb-2"
            >
              <span className="text-sm text-slate-600">Active State</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                isChanged ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                {selectedRecord.status.toUpperCase()}
              </span>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-100 shadow-sm mb-2">
            <span className="text-sm text-slate-600">Item Cost Delta</span>
            <div className="flex items-center gap-1 text-sm font-medium">
              {(selectedRecord.projectedCostChange || 0) > 0 ? <TrendingUp size={16} className="text-red-500" /> :
               (selectedRecord.projectedCostChange || 0) < 0 ? <TrendingDown size={16} className="text-green-500" /> :
               <Minus size={16} className="text-slate-400" />}
              <span className={
                (selectedRecord.projectedCostChange || 0) > 0 ? 'text-red-600' :
                (selectedRecord.projectedCostChange || 0) < 0 ? 'text-green-600' :
                'text-slate-600'
              }>
                {selectedRecord.projectedCostChange ? (selectedRecord.projectedCostChange > 0 ? '+' : '') + selectedRecord.projectedCostChange.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-100 shadow-sm mb-2">
            <span className="text-sm text-slate-600">Item Flavor Impact</span>
            <span className="text-sm font-medium text-slate-700">{selectedRecord.projectedFlavorImpact || 'Neutral'}</span>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">Collection Est. Cost Change</span>
              <span className={`text-sm font-bold ${derivedState.estimatedCostChange > 0 ? 'text-red-600' : derivedState.estimatedCostChange < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                {derivedState.estimatedCostChange > 0 ? '+' : ''}{derivedState.estimatedCostChange.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
