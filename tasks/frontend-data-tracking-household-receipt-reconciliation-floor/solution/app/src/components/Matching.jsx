import React, { useState } from 'react';
import { useStore } from '../store';
import { Link, Check, AlertTriangle } from 'lucide-react';

export default function Matching() {
  const receipts = useStore(s => s.receipts);
  const bankRecords = useStore(s => s.bankRecords);
  const matches = useStore(s => s.matches);
  const matchRecord = useStore(s => s.matchRecord);
  const resolveRecord = useStore(s => s.resolveRecord);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);

  // Calculate receipt totals
  const getReceiptTotal = (r) => {
    if (!r) return 0;
    return r.lines.reduce((acc, l) => acc + l.subtotal, 0) + r.tax + r.tip;
  };

  const handleMatch = () => {
    if (!selectedReceipt || selectedRecords.length === 0) return;

    // Check amounts
    const rAmount = getReceiptTotal(receipts.find(r => r.id === selectedReceipt));
    const bAmount = bankRecords.filter(b => selectedRecords.includes(b.id)).reduce((acc, b) => acc + Math.abs(b.amount), 0);

    const isExact = rAmount === bAmount;

    matchRecord([selectedReceipt], selectedRecords, isExact ? 'exact' : 'aggregate');
    setSelectedReceipt(null);
    setSelectedRecords([]);
  };

  const handleResolveDuplicate = (recordId) => {
    resolveRecord(recordId, 'Resolved as duplicate');
  };

  const currentReceiptTotal = selectedReceipt ? getReceiptTotal(receipts.find(r => r.id === selectedReceipt)) : 0;
  const currentRecordsTotal = bankRecords.filter(b => selectedRecords.includes(b.id)).reduce((acc, b) => acc + Math.abs(b.amount), 0);
  const difference = Math.abs(currentReceiptTotal - currentRecordsTotal);
  const isMatchExact = difference === 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full pb-20">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <h2 className="text-lg font-semibold sticky top-0 bg-gray-50 py-2 z-10">Receipts (Unmatched)</h2>
        {receipts.filter(r => !matches.some(m => m.receiptIds.includes(r.id))).map(receipt => {
          const total = getReceiptTotal(receipt);
          return (
            <div
              key={receipt.id}
              onClick={() => setSelectedReceipt(receipt.id === selectedReceipt ? null : receipt.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors shadow-sm ${selectedReceipt === receipt.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{receipt.merchant}</h3>
                <span className="font-semibold text-lg text-gray-900">${(total / 100).toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-500 flex justify-between">
                <span>{receipt.date}</span>
                <span>{receipt.lines.length} lines</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pl-2">
        <h2 className="text-lg font-semibold sticky top-0 bg-gray-50 py-2 z-10">Bank Records</h2>
        {bankRecords.filter(b => !b.matched).map(record => {
          const isSelected = selectedRecords.includes(record.id);
          const isDuplicate = !!record.duplicateOf;

          return (
            <div
              key={record.id}
              className={`p-4 rounded-lg border transition-colors shadow-sm ${record.resolved ? 'opacity-50 bg-gray-50 border-gray-200' : isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : isDuplicate ? 'border-amber-400 bg-amber-50' : 'bg-white border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={record.resolved}
                    onChange={() => setSelectedRecords(prev => prev.includes(record.id) ? prev.filter(x => x !== record.id) : [...prev, record.id])}
                    className="mr-3 mt-1 cursor-pointer disabled:cursor-not-allowed w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 leading-tight">{record.description}</h3>
                    <div className="text-sm text-gray-500 mt-1 flex gap-2">
                      <span>{record.date}</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs capitalize">{record.type}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-semibold text-lg ${record.amount < 0 ? 'text-gray-900' : 'text-green-600'}`}>
                  ${(Math.abs(record.amount) / 100).toFixed(2)}
                </span>
              </div>

              {isDuplicate && !record.resolved && (
                <div className="mt-3 ml-7 flex items-center justify-between border-t border-amber-200 pt-2">
                  <div className="text-sm text-amber-800 flex items-center font-medium">
                    <AlertTriangle size={14} className="mr-1.5" /> Flagged duplicate
                  </div>
                  <button
                    onClick={() => handleResolveDuplicate(record.id)}
                    className="text-xs bg-amber-200 text-amber-900 px-3 py-1.5 rounded-md hover:bg-amber-300 font-semibold shadow-sm transition-colors"
                  >
                    Resolve Ignore
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(selectedReceipt || selectedRecords.length > 0) && (
        <div className="fixed bottom-0 left-48 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex items-center justify-between z-20 px-8">
          <div className="flex gap-10">
            <div>
              <span className="text-sm font-medium text-gray-500 block uppercase tracking-wider mb-1">Receipt</span>
              <span className="font-bold text-xl text-gray-900">
                ${(currentReceiptTotal / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 block uppercase tracking-wider mb-1">Records</span>
              <span className="font-bold text-xl text-gray-900">
                ${(currentRecordsTotal / 100).toFixed(2)}
              </span>
            </div>
            <div className="border-l-2 border-gray-200 pl-10">
              <span className="text-sm font-medium text-gray-500 block uppercase tracking-wider mb-1">Difference</span>
              <span className={`font-bold text-xl flex items-center ${
                selectedReceipt ? (isMatchExact ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'
              }`}>
                ${(difference / 100).toFixed(2)}
                {selectedReceipt && isMatchExact && <Check size={20} className="ml-2" />}
              </span>
            </div>
          </div>
          <button
            onClick={handleMatch}
            disabled={!selectedReceipt || selectedRecords.length === 0}
            className="flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm"
          >
            <Link size={20} className="mr-2" />
            {isMatchExact ? 'Match Exact' : 'Match Aggregate'}
          </button>
        </div>
      )}
    </div>
  );
}
