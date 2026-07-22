import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Save, GitBranch, AlertTriangle } from 'lucide-react';

export default function SplitRules() {
  const rules = useStore(s => s.rules);
  const addRule = useStore(s => s.addRule);
  const members = useStore(s => s.members);
  const categories = useStore(s => s.categories);
  const receipts = useStore(s => s.receipts);

  const [merchantMatch, setMerchantMatch] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);

  const handleCreateRule = () => {
    if (!merchantMatch || selectedTargets.length === 0) return;

    addRule({
      merchantMatch,
      targets: selectedTargets,
      categoryId: selectedCategory,
      priority: rules.length + 1
    });

    setMerchantMatch('');
    setSelectedTargets([]);
  };

  const previewCount = (matchStr) => {
    if (!matchStr) return 0;
    return receipts.filter(r => r.merchant.toLowerCase().includes(matchStr.toLowerCase())).length;
  };

  return (
    <div className="flex gap-6 h-full pb-10">
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white p-4">
            <h3 className="font-medium">Rule Composer</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant contains</label>
              <input
                type="text"
                value={merchantMatch}
                onChange={e => setMerchantMatch(e.target.value)}
                placeholder="e.g., MegaMart"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              {merchantMatch && (
                <p className="text-xs text-gray-500 mt-1">
                  Matches {previewCount(merchantMatch)} receipts
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Propose Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Propose Targets (Equal split)</label>
              <div className="grid grid-cols-2 gap-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center p-2 border rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(m.id)}
                      onChange={() => setSelectedTargets(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                      className="mr-2"
                    />
                    <span className="text-sm">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRule}
              disabled={!merchantMatch || selectedTargets.length === 0}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Create Rule Proposal
            </button>
          </div>
        </div>
      </div>

      <div className="w-2/3 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold">Active Rules ({rules.length})</h2>
        {rules.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 p-8 text-center text-gray-500 rounded-lg">
            No rules authored yet. Rules propose allocations for matching receipts.
          </div>
        ) : (
          rules.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-mono mr-2">v{r.version}</span>
                  <h3 className="font-medium text-gray-900">Merchant matches "{r.merchantMatch}"</h3>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-blue-600" title="Edit creating new branch"><GitBranch size={16} /></button>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <div><span className="font-medium">Category:</span> {categories.find(c => c.id === r.categoryId)?.name}</div>
                <div><span className="font-medium">Targets:</span> {r.targets.map(t => members.find(m => m.id === t)?.name).join(', ')}</div>
                <div><span className="font-medium">Priority:</span> {r.priority}</div>
              </div>

              {/* Conflict demonstration */}
              {rules.filter(other => other.id !== r.id && other.merchantMatch === r.merchantMatch).length > 0 && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-center border border-amber-200">
                  <AlertTriangle size={14} className="mr-1" /> Overlaps with another rule. Priority {r.priority} applies first.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
