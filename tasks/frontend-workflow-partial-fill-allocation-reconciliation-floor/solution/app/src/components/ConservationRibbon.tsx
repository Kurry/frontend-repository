import React from 'react';
import { useAppStore } from '../store/store';

export const ConservationRibbon: React.FC = () => {
  const { fills, intents, allocations, exceptions } = useAppStore();

  const totalIntentQty = intents.reduce((sum, i) => sum + i.quantity, 0);
  const totalFillQty = fills.reduce((sum, f) => sum + f.quantity, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantity, 0);

  // exceptions would technically reduce allocatable, simplified here.
  const excepted = exceptions.length;

  return (
    <div className="bg-blue-900 text-white p-2 flex justify-between text-sm shadow-md z-10 relative">
      <div><strong>Conservation Ribbon</strong></div>
      <div className="flex gap-4">
        <div>Intended: {totalIntentQty}</div>
        <div>Fills: {totalFillQty}</div>
        <div>Allocated: {totalAllocated}</div>
        <div>Remaining Intent: {totalIntentQty - totalAllocated}</div>
        <div>Remaining Fill: {totalFillQty - totalAllocated}</div>
        <div>Exceptions: {excepted}</div>
      </div>
    </div>
  );
};
