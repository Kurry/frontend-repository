import React from 'react';
import { useAppStore } from '../store/store';

export const RuleGuard: React.FC = () => {
  const { locates, ruleOverrides } = useAppStore();

  return (
    <div className="p-2 border bg-red-50 mt-2 h-48 overflow-y-auto text-sm">
      <h3 className="font-bold">Locates & Overrides</h3>
      <div className="flex gap-4">
        <div>
          <h4 className="font-semibold">Locate Inventory</h4>
          {locates.map(l => (
            <div key={`${l.accountId}-${l.symbol}`}>
              {l.accountId} {l.symbol}: {l.availableQuantity}
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-semibold">Overrides</h4>
          {ruleOverrides.map(o => (
            <div key={o.id}>
              {o.allocationId} - {o.ruleCode} - {o.reasonCode}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
