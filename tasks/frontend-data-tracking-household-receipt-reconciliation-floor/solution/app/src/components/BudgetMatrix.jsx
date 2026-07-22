import React from 'react';
import { useStore } from '../store';

export default function BudgetMatrix() {
  const members = useStore(s => s.members);
  const categories = useStore(s => s.categories);
  const receipts = useStore(s => s.receipts);

  // Calculate allocations per member per category
  const matrix = members.map(m => {
    const cats = categories.map(c => {
      let allocated = 0;
      receipts.forEach(r => {
        r.allocations.forEach(a => {
          if (a.categoryId === c.id && a.targets.includes(m.id)) {
            const line = r.lines.find(l => l.id === a.lineId);
            if (line) {
              let lineAmount = line.subtotal;

              if (r.tax > 0 && line.taxEligible) {
                 const eligibleTotal = r.lines.filter(l => l.taxEligible).reduce((sum, l) => sum + l.subtotal, 0);
                 if (eligibleTotal > 0) {
                     lineAmount += Math.round(r.tax * (line.subtotal / eligibleTotal));
                 }
              }
              if (r.tip > 0) {
                  const lineTotal = r.lines.reduce((sum, l) => sum + l.subtotal, 0);
                  if (lineTotal > 0) {
                      lineAmount += Math.round(r.tip * (line.subtotal / lineTotal));
                  }
              }

              if (a.type === 'equal') {
                allocated += Math.round(lineAmount / a.targets.length);
              } else if (a.type === 'exact') {
                // In exact mode we assume it splits equally for the demo
                allocated += Math.round(lineAmount / a.targets.length);
              } else if (a.type === 'percentage') {
                allocated += Math.round(lineAmount / a.targets.length);
              }
            }
          }
        });
      });
      return { categoryId: c.id, allocated, budget: c.budget };
    });
    return { memberId: m.id, name: m.name, categories: cats };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Budget Consequence Matrix</h2>
          <p className="text-sm text-gray-500 mt-1">Allocated spending per person versus budget limits</p>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-white sticky top-0 shadow-sm z-10">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 border-r border-gray-200">Person</th>
              {categories.map(c => (
                <th key={c.id} className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-right bg-white">
                  {c.name}
                  <div className="text-xs text-gray-400 font-normal mt-1">Bgt: ${(c.budget / 100).toFixed(2)}</div>
                </th>
              ))}
              <th className="px-6 py-4 font-bold text-gray-900 uppercase tracking-wider text-right bg-gray-50 border-l border-gray-200">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matrix.map(row => (
              <tr key={row.memberId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5 whitespace-nowrap font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50">{row.name}</td>
                {row.categories.map(c => {
                  const overBudget = c.allocated > c.budget;
                  return (
                    <td key={c.categoryId} className="px-6 py-5 whitespace-nowrap text-right">
                      <div className={`font-medium ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        ${(c.allocated / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {overBudget ? 'Over budget' : `${((c.allocated / c.budget) * 100).toFixed(0)}% used`}
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-5 whitespace-nowrap text-right font-bold border-l border-gray-200 bg-gray-50/50">
                  ${(row.categories.reduce((acc, c) => acc + c.allocated, 0) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold border-t-2 border-gray-300">
            <tr>
              <td className="px-6 py-4 border-r border-gray-200">Household Total</td>
              {categories.map(c => {
                const colTotal = matrix.reduce((acc, row) => acc + row.categories.find(cat => cat.categoryId === c.id).allocated, 0);
                return (
                  <td key={c.id} className="px-6 py-4 text-right">
                    ${(colTotal / 100).toFixed(2)}
                  </td>
                );
              })}
              <td className="px-6 py-4 text-right border-l border-gray-200">
                ${(matrix.reduce((acc, row) => acc + row.categories.reduce((sum, c) => sum + c.allocated, 0), 0) / 100).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
