import React from 'react';
import { useAppState, useAppDispatch } from '../store';

export default function CapacityTerrain() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { capacityPlan, budgetHours, branches } = state;

  const plannedHours = capacityPlan.reduce((acc, p) => acc + (p.hours || 0), 0);

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="capacity-terrain">
      <h2 className="text-xl font-bold mb-2">Capacity Terrain</h2>
      <div className="mb-2 text-sm">
        Budget: {budgetHours} hrs | Planned: {plannedHours} hrs | Remaining: {budgetHours - plannedHours} hrs
      </div>
      <div className="mb-4">
        {branches.length > 0 && (
          <button
            className="bg-indigo-500 text-white px-3 py-1 rounded"
            onClick={() => dispatch({
              type: 'PLACE_CAPACITY',
              payload: { id: `cap-${Date.now()}`, branchId: branches[0].id, hours: 2, slot: 'Monday AM' }
            })}
          >
            Place First Branch (2 hrs)
          </button>
        )}
      </div>
      <div className="space-y-2">
        {capacityPlan.map(p => (
          <div key={p.id} className="border p-2">
            <div className="font-semibold">{p.slot}</div>
            <div className="text-sm">Branch: {p.branchId} | {p.hours} hrs</div>
          </div>
        ))}
        {capacityPlan.length === 0 && <div className="text-sm text-gray-500">No capacity planned yet.</div>}
      </div>
    </div>
  );
}
