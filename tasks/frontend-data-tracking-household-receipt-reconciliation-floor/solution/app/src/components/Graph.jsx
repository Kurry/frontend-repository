import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Pin } from 'lucide-react';

export default function Graph() {
  const members = useStore(s => s.members);
  const receipts = useStore(s => s.receipts);
  const pinnedEdges = useStore(s => s.pinnedEdges);
  const pinEdge = useStore(s => s.pinEdge);

  const obligations = useMemo(() => {
    // 1. Calculate raw balances (who owes whom what)
    const balances = Object.fromEntries(members.map(m => [m.id, 0]));

    receipts.forEach(r => {
      r.allocations.forEach(a => {
        const line = r.lines.find(l => l.id === a.lineId);
        if (line) {
          let lineAmount = line.subtotal;
          if (r.tax > 0 && line.taxEligible) {
             const eligibleTotal = r.lines.filter(l => l.taxEligible).reduce((sum, l) => sum + l.subtotal, 0);
             if (eligibleTotal > 0) lineAmount += Math.round(r.tax * (line.subtotal / eligibleTotal));
          }
          if (r.tip > 0) {
              const lineTotal = r.lines.reduce((sum, l) => sum + l.subtotal, 0);
              if (lineTotal > 0) lineAmount += Math.round(r.tip * (line.subtotal / lineTotal));
          }

          let allocatedAmount = 0;
          if (a.type === 'equal') allocatedAmount = Math.round(lineAmount / a.targets.length);
          else if (a.type === 'percentage') allocatedAmount = Math.round(lineAmount / a.targets.length);
          else if (a.type === 'exact') allocatedAmount = Math.round(lineAmount / a.targets.length);

          a.targets.forEach(tId => {
            if (tId !== r.purchaserId) {
              balances[tId] -= allocatedAmount;
              balances[r.purchaserId] += allocatedAmount;
            }
          });
        }
      });
    });

    // 2. Minimum transfer netting logic
    const debtors = [];
    const creditors = [];

    for (const [id, bal] of Object.entries(balances)) {
      if (bal < 0) debtors.push({ id, amount: Math.abs(bal) });
      else if (bal > 0) creditors.push({ id, amount: bal });
    }

    // Sort deterministically
    debtors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
    creditors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

    const transfers = [];

    // First satisfy pinned edges
    pinnedEdges.forEach(pe => {
       transfers.push({ from: pe.from, to: pe.to, amount: pe.amount, pinned: true });
       const debtor = debtors.find(d => d.id === pe.from);
       const creditor = creditors.find(c => c.id === pe.to);
       if (debtor) debtor.amount -= pe.amount;
       if (creditor) creditor.amount -= pe.amount;
    });

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      if (debtors[i].amount === 0) { i++; continue; }
      if (creditors[j].amount === 0) { j++; continue; }

      const min = Math.min(debtors[i].amount, creditors[j].amount);
      if (min > 0) {
        transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: min, pinned: false });
      }

      debtors[i].amount -= min;
      creditors[j].amount -= min;
    }

    return transfers;
  }, [receipts, members, pinnedEdges]);

  return (
    <div className="flex gap-6 h-full pb-10">
      <div className="w-1/3 overflow-y-auto space-y-4 pr-2">
        <h2 className="text-lg font-semibold sticky top-0 bg-gray-50 py-2 z-10">Settlement Transfers</h2>

        {obligations.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            No active obligations. Allocate receipts to see the settlement plan.
          </div>
        ) : (
          obligations.map((t, idx) => {
            const fromMem = members.find(m => m.id === t.from);
            const toMem = members.find(m => m.id === t.to);
            return (
              <div key={idx} className={`p-4 rounded-lg border shadow-sm flex items-center justify-between ${t.pinned ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">{fromMem?.name} pays</div>
                  <div className="font-semibold text-lg text-gray-900">${(t.amount / 100).toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mt-1">to {toMem?.name}</div>
                </div>
                <button
                  disabled={t.pinned}
                  onClick={() => pinEdge(t.from, t.to, t.amount)}
                  className={`p-2 rounded-full ${t.pinned ? 'bg-blue-200 text-blue-700 cursor-default' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'}`}
                  title={t.pinned ? "Edge pinned" : "Pin this transfer"}
                >
                  <Pin size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="absolute inset-0 p-8 flex items-center justify-center pointer-events-none opacity-50">
           {/* SVG rendering for money flow */}
           <svg width="100%" height="100%" className="overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                </marker>
              </defs>

              {/* This is a simple visual approximation for the UI since full graph layout is complex */}
              {members.map((m, i) => {
                 const x = 200 + 200 * Math.cos(2 * Math.PI * i / members.length);
                 const y = 200 + 150 * Math.sin(2 * Math.PI * i / members.length);
                 return (
                   <g key={m.id}>
                     <circle cx={x} cy={y} r="40" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
                     <text x={x} y={y} textAnchor="middle" dy=".3em" fill="#374151" fontWeight="bold">{m.name}</text>
                   </g>
                 )
              })}

              {obligations.map((t, i) => {
                 const fromIdx = members.findIndex(m => m.id === t.from);
                 const toIdx = members.findIndex(m => m.id === t.to);

                 const fx = 200 + 200 * Math.cos(2 * Math.PI * fromIdx / members.length);
                 const fy = 200 + 150 * Math.sin(2 * Math.PI * fromIdx / members.length);
                 const tx = 200 + 200 * Math.cos(2 * Math.PI * toIdx / members.length);
                 const ty = 200 + 150 * Math.sin(2 * Math.PI * toIdx / members.length);

                 // Add curve if bidirectional
                 return (
                   <line key={i} x1={fx} y1={fy} x2={tx} y2={ty} stroke={t.pinned ? "#3B82F6" : "#9CA3AF"} strokeWidth={2} strokeDasharray={t.pinned ? "none" : "5,5"} markerEnd="url(#arrowhead)" />
                 )
              })}
           </svg>
        </div>
        <div className="p-4 bg-gray-900/5 backdrop-blur-sm border-b border-gray-200">
           <h3 className="font-medium text-gray-900">Money Flow Statement</h3>
        </div>
      </div>
    </div>
  );
}
