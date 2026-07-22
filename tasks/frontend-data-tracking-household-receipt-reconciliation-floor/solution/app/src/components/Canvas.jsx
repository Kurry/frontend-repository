import React, { useState } from 'react';
import { useStore } from '../store';
import { User, Tag, FileText, Check, DollarSign } from 'lucide-react';

export default function Canvas() {
  const receipts = useStore(s => s.receipts);
  const allocateLine = useStore(s => s.allocateLine);
  const members = useStore(s => s.members);
  const categories = useStore(s => s.categories);

  const [selectedTargets, setSelectedTargets] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const [allocationType, setAllocationType] = useState('equal');

  const toggleTarget = (mId) => {
    setSelectedTargets(prev => prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]);
  };

  const handleAllocate = (receiptId, lineId) => {
    if (selectedTargets.length === 0) return;
    allocateLine(receiptId, lineId, allocationType, selectedTargets, selectedCategoryId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full pb-10">
      <div className="flex-1 overflow-y-auto space-y-6">
        <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-gray-50 py-2 z-10">Receipt Canvas</h2>
        {receipts.map(receipt => (
          <div key={receipt.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{receipt.merchant}</h3>
                <p className="text-sm text-gray-500">{receipt.date}</p>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 mr-2">Purchaser:</span>
                <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">{members.find(m => m.id === receipt.purchaserId)?.name}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {receipt.lines.map(line => {
                const allocation = receipt.allocations.find(a => a.lineId === line.id);
                return (
                  <div key={line.id} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileText size={16} className="text-gray-400 mr-2" />
                        <span className="font-medium">{line.description}</span>
                        {line.taxEligible && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Tax</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Qty: {line.quantity} &times; ${(line.subtotal / line.quantity / 100).toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right sm:w-24 font-medium text-lg text-gray-900">
                      ${(line.subtotal / 100).toFixed(2)}
                    </div>

                    <div className="w-full sm:w-64">
                      {allocation ? (
                        <div className="text-sm bg-blue-50 text-blue-800 px-3 py-2 rounded-lg border border-blue-100 flex flex-col">
                          <div className="font-medium mb-1 border-b border-blue-100 pb-1">{categories.find(c => c.id === allocation.categoryId)?.name}</div>
                          <div className="text-blue-600 flex flex-wrap gap-1 mt-1">
                            {allocation.targets.map(t => (
                              <span key={t} className="bg-white px-2 py-0.5 rounded text-xs shadow-sm">{members.find(m => m.id === t)?.name}</span>
                            ))}
                          </div>
                          <div className="text-xs text-blue-400 mt-1 uppercase tracking-wider">{allocation.type}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAllocate(receipt.id, line.id)}
                          disabled={selectedTargets.length === 0}
                          className="w-full py-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors"
                        >
                          Allocate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm flex justify-between text-gray-600">
              <div className="flex gap-4">
                <span>Tax: ${(receipt.tax / 100).toFixed(2)}</span>
                <span>Tip: ${(receipt.tip / 100).toFixed(2)}</span>
              </div>
              <div className="font-medium text-gray-900 text-lg">Total: ${((receipt.lines.reduce((acc, l) => acc + l.subtotal, 0) + receipt.tax + receipt.tip) / 100).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full md:w-80 flex flex-col gap-6 sticky top-4 h-fit">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white p-4">
            <h3 className="font-medium mb-1">Ribbon Tool</h3>
            <p className="text-gray-400 text-xs">Configure targets for next allocation</p>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center"><User size={14} className="mr-1" /> Targets</h3>
              <div className="grid grid-cols-2 gap-2">
                {members.map(m => (
                  <label key={m.id} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${selectedTargets.includes(m.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedTargets.includes(m.id)}
                      onChange={() => toggleTarget(m.id)}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${selectedTargets.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {selectedTargets.includes(m.id) && <Check size={12} />}
                    </div>
                    <span className="font-medium text-sm">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center"><Tag size={14} className="mr-1" /> Category</h3>
              <select
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-shadow"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center"><DollarSign size={14} className="mr-1" /> Split Mode</h3>
              <select
                value={allocationType}
                onChange={e => setAllocationType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-shadow"
              >
                <option value="equal">Equal Shares</option>
                <option value="percentage">Percentage</option>
                <option value="exact">Exact Cents</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
