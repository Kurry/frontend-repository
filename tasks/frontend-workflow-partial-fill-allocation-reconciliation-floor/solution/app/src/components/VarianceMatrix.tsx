import React from 'react';
import { useAppStore } from '../store/store';
import { calculateRemainingIntent } from '../utils/allocations';

export const VarianceMatrix: React.FC = () => {
  const { intents, allocations } = useAppStore();

  // For each account/symbol, report intended quantity, allocated quantity, shortfall.
  const matrixData = intents.map(intent => {
    const allocated = allocations
      .filter(a => a.intentId === intent.id)
      .reduce((sum, a) => sum + a.quantity, 0);
    const weightedSum = allocations
      .filter(a => a.intentId === intent.id)
      .reduce((sum, a) => sum + (a.quantity * a.price), 0);
    const weightedAvg = allocated > 0 ? (weightedSum / allocated).toFixed(2) : '0.00';

    return {
      id: intent.id,
      account: intent.accountId,
      symbol: intent.symbol,
      intended: intent.quantity,
      allocated,
      shortfall: intent.quantity - allocated,
      weightedAvg
    };
  });

  return (
    <div className="p-2 border mt-2 h-48 overflow-y-auto">
      <h3 className="font-bold">Variance Matrix</h3>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-gray-100">
            <th>Account</th>
            <th>Symbol</th>
            <th>Intended</th>
            <th>Allocated</th>
            <th>Shortfall</th>
            <th>WAP</th>
          </tr>
        </thead>
        <tbody>
          {matrixData.map(d => (
            <tr key={d.id} className="border-b">
              <td>{d.account}</td>
              <td>{d.symbol}</td>
              <td>{d.intended}</td>
              <td>{d.allocated}</td>
              <td>{d.shortfall}</td>
              <td>{d.weightedAvg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
