import React, { useState } from 'react';
import { GitBranch, Scale } from 'lucide-react';
import type { PackingItem, DerivedState } from '../types';

interface ScenarioWeaverProps {
  selectedItem: PackingItem | null;
  branchIntoScenario: (baseItemId: string, scenarioName: string) => void;
  derived: DerivedState;
  records: PackingItem[];
}

export function ScenarioWeaver({ selectedItem, branchIntoScenario, derived, records }: ScenarioWeaverProps) {
  const [scenarioName, setScenarioName] = useState('');

  if (!selectedItem) return null;

  const isScenario = selectedItem.scenarioWeaverState?.isScenario;
  const baseItemId = selectedItem.scenarioWeaverState?.baseItemId;
  const baseItem = isScenario && baseItemId ? records.find(r => r.id === baseItemId) : null;

  const handleBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (scenarioName.trim()) {
      branchIntoScenario(selectedItem.id, scenarioName.trim());
      setScenarioName('');
    }
  };

  const linkedOutcomes = derived.scenarioComparisons.filter(c =>
    c.baseItemId === selectedItem.id || c.scenarioItemId === selectedItem.id
  );

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="p-4 border-b border-slate-700 bg-slate-900/30">
        <h2 className="text-lg font-semibold text-slate-200">Inspector</h2>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-white">{selectedItem.name}</h3>
            {isScenario && <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded">Scenario</span>}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Status</span>
              <span className="capitalize font-medium text-slate-200">{selectedItem.status}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Category</span>
              <span className="font-medium text-slate-200">{selectedItem.category}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Weight</span>
              <span className="font-medium text-slate-200">{selectedItem.weight}g</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-1">Quantity</span>
              <span className="font-medium text-slate-200">{selectedItem.quantity}</span>
            </div>
          </div>
        </div>

        {!isScenario && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <GitBranch className="w-5 h-5" />
              <h4 className="font-medium">Scenario Weaver</h4>
            </div>
            <p className="text-sm text-slate-300">Branch this item to explore alternatives without losing the original.</p>
            <form onSubmit={handleBranch} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Lighter variant"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!scenarioName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Branch
              </button>
            </form>
          </div>
        )}

        {(linkedOutcomes.length > 0 || isScenario) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Scale className="w-4 h-4" />
              <h4 className="font-medium text-sm">Linked Outcomes</h4>
            </div>
            <div className="space-y-2">
              {isScenario && baseItem && (
                <div className="bg-slate-900 p-3 rounded-lg border border-amber-500/30 text-sm">
                  <div className="text-slate-400 mb-2">Comparing against base: <span className="text-slate-200">{baseItem.name}</span></div>
                  <div className="flex items-center justify-between">
                    <span>Weight Difference:</span>
                    <span className={`font-mono ${
                      (selectedItem.weight * selectedItem.quantity) > (baseItem.weight * baseItem.quantity)
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}>
                      {((selectedItem.weight * selectedItem.quantity) - (baseItem.weight * baseItem.quantity)) > 0 ? '+' : ''}
                      {((selectedItem.weight * selectedItem.quantity) - (baseItem.weight * baseItem.quantity))}g
                    </span>
                  </div>
                </div>
              )}

              {!isScenario && linkedOutcomes.map(outcome => {
                const scenarioItem = records.find(r => r.id === outcome.scenarioItemId);
                if (!scenarioItem) return null;
                return (
                  <div key={outcome.scenarioItemId} className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-sm flex items-center justify-between">
                    <div>
                      <div className="text-amber-400 text-xs mb-1">Scenario Variant</div>
                      <div className="text-slate-200">{scenarioItem.name}</div>
                    </div>
                    <div className={`font-mono ${outcome.weightDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {outcome.weightDiff > 0 ? '+' : ''}{outcome.weightDiff}g
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
