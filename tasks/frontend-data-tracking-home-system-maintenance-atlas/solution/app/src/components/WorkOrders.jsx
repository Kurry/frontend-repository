import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Wrench, Package, ArrowRight, ShieldCheck } from 'lucide-react';

export const WorkOrders = () => {
  const { state, dispatch } = useAppContext();
  const [selectedPart, setSelectedPart] = useState('');

  const reservePart = (woId, partId) => {
    if (!partId) return;
    dispatch({ type: 'RESERVE_PART', payload: { workOrderId: woId, partId, quantity: 1, status: 'reserved' } });
  };

  const advanceStep = (woId, currentStatus) => {
    const sequence = ['queued', 'active', 'verify', 'complete'];
    const idx = sequence.indexOf(currentStatus);
    if (idx < sequence.length - 1) {
      if (currentStatus === 'active') {
        const woReservations = state.reservations.filter(r => r.workOrderId === woId && r.status === 'reserved');
        woReservations.forEach(r => dispatch({ type: 'CONSUME_PART', payload: { reservationId: r.id } }));
      }
      dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: woId, updates: { status: sequence[idx + 1] } } });
    }
  };

  const rollback = (woId) => {
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: woId, updates: { status: 'rolled back' } } });
  };

  const verifyAndCertify = (woId) => {
    dispatch({ type: 'CERTIFY', payload: { workOrderId: woId, type: 'maintenance' } });
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: { id: woId, updates: { status: 'closed' } } });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wrench size={20} className="text-orange-600" /> Work Orders & Inventory
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Active Work Orders</h3>
          {state.workOrders.length === 0 ? (
            <div className="text-sm text-gray-500 italic p-4 bg-white rounded border">No active orders</div>
          ) : (
            <div className="space-y-3">
              {state.workOrders.map(wo => {
                const asset = state.assets.find(a => a.id === wo.assetId);
                const reservedIds = state.reservations.filter(r => r.workOrderId === wo.id).map(r => r.partId);
                const canReserve = wo.status === 'queued' || wo.status === 'active';

                return (
                  <div key={wo.id} className="p-3 border rounded shadow-sm bg-white relative">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium text-sm text-gray-800">{wo.task}</div>
                      <div className="text-xs uppercase px-2 py-1 bg-gray-100 rounded font-bold text-gray-600">{wo.status}</div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">{asset?.name}</div>

                    {wo.partsRequired?.length > 0 && (
                      <div className="mb-3 p-2 bg-orange-50 rounded border border-orange-100">
                        <div className="text-xs font-semibold text-orange-800 mb-1 flex items-center gap-1">
                          <Package size={12} /> Requires Parts
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="text-xs p-1 border rounded flex-1 bg-white"
                            onChange={e => setSelectedPart(e.target.value)}
                            disabled={!canReserve}
                          >
                            <option value="">Select part...</option>
                            {state.parts.map(p => (
                              <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                {p.name} ({p.quantity} avail) {p.quantity <= 0 ? ' - OUT' : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                            onClick={() => reservePart(wo.id, selectedPart)}
                            disabled={!canReserve || !selectedPart}
                          >
                            Reserve
                          </button>
                        </div>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {reservedIds.map(rid => {
                            const p = state.parts.find(x => x.id === rid);
                            const res = state.reservations.find(r => r.workOrderId === wo.id && r.partId === rid);
                            return <span key={rid} className={`text-[10px] px-1.5 py-0.5 rounded border ${res?.status === 'consumed' ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-800'}`}>
                              {p?.name} ({res?.status})
                            </span>;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <button className="text-xs text-red-600 hover:underline" onClick={() => rollback(wo.id)}>Rollback</button>

                      {wo.status === 'verify' ? (
                        <button className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700" onClick={() => verifyAndCertify(wo.id)}>
                          <ShieldCheck size={14} /> Verify & Close
                        </button>
                      ) : wo.status !== 'closed' && wo.status !== 'rolled back' && (
                        <button className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700" onClick={() => advanceStep(wo.id, wo.status)}>
                          Next <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Inventory Ledger</h3>
          <div className="bg-white rounded border shadow-sm max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="p-2 font-medium text-gray-600">Part</th>
                  <th className="p-2 font-medium text-gray-600 w-16">Avail</th>
                  <th className="p-2 font-medium text-gray-600 w-24">Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {state.parts.map(p => {
                  const isLow = p.quantity <= 1;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-2">{p.name}</td>
                      <td className={`p-2 font-mono font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{p.quantity}</td>
                      <td className="p-2 text-gray-500 font-mono text-[10px]">{p.lot}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
