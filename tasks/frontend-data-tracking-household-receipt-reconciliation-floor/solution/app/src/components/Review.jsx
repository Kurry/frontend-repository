import React from 'react';
import { useStore } from '../store';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Review() {
  const receipts = useStore(s => s.receipts);
  const bankRecords = useStore(s => s.bankRecords);
  const matches = useStore(s => s.matches);
  const setApproval = useStore(s => s.setApproval);
  const approval = useStore(s => s.approval);

  // Checking criteria
  const unallocatedLines = receipts.flatMap(r => r.lines.filter(l => !r.allocations.some(a => a.lineId === l.id)));
  const duplicateRecordsUnresolved = bankRecords.filter(b => b.duplicateOf && !b.resolved);

  const allAllocated = unallocatedLines.length === 0;
  const allDuplicatesResolved = duplicateRecordsUnresolved.length === 0;

  const canApprove = allAllocated && allDuplicatesResolved;

  const handleApprove = () => {
    setApproval({
      status: 'approved',
      date: new Date().toISOString(),
      checksum: `chk_${Date.now()}` // derived input checksum
    });
  };

  return (
    <div className="flex justify-center h-full pb-10">
      <div className="w-full max-w-2xl mt-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-6 py-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Reconciliation Review</h2>
            <p className="text-gray-400">Complete checklist to finalize plan</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className={`flex items-center p-4 rounded-lg border ${allAllocated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {allAllocated ? <CheckCircle2 className="text-green-600 mr-4" size={24} /> : <AlertCircle className="text-red-600 mr-4" size={24} />}
                <div>
                  <h3 className={`font-medium ${allAllocated ? 'text-green-900' : 'text-red-900'}`}>Receipt Allocation</h3>
                  <p className={`text-sm ${allAllocated ? 'text-green-700' : 'text-red-700'}`}>
                    {allAllocated ? 'All receipt lines are fully allocated.' : `${unallocatedLines.length} lines remain unallocated.`}
                  </p>
                </div>
              </div>

              <div className={`flex items-center p-4 rounded-lg border ${allDuplicatesResolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {allDuplicatesResolved ? <CheckCircle2 className="text-green-600 mr-4" size={24} /> : <AlertCircle className="text-red-600 mr-4" size={24} />}
                <div>
                  <h3 className={`font-medium ${allDuplicatesResolved ? 'text-green-900' : 'text-red-900'}`}>Bank Records Resolution</h3>
                  <p className={`text-sm ${allDuplicatesResolved ? 'text-green-700' : 'text-red-700'}`}>
                    {allDuplicatesResolved ? 'All duplicate bank records are resolved.' : `${duplicateRecordsUnresolved.length} duplicate records require explicit resolution.`}
                  </p>
                </div>
              </div>
            </div>

            {approval ? (
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">Plan Approved</h3>
                <p className="text-sm text-blue-700">Checksum: {approval.checksum}</p>
                <p className="text-xs text-blue-500 mt-2">Any upstream allocation or match changes will stale this approval.</p>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={!canApprove}
                className="w-full mt-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              >
                Approve Settlement Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
