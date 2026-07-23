
import { usePlanStore, computeDiagnostics, computeCurve } from '../store';
import { generatePlanPacket } from '../exportUtils';

export const Inspector = () => {
  const store = usePlanStore();
  const diagnostics = computeDiagnostics(store);
  const { samples, targetReachedAt } = computeCurve(store);

  const sample1030 = samples.find(s => s.sampleAt === '2026-10-17T10:30:00Z');
  const bufferDiag = diagnostics.find(d => d.id === 'DG-SHAPE-BUFFER');
  const buffer = targetReachedAt ? (bufferDiag ? bufferDiag.measured : 10) : 10;

  const handleExport = async () => {
     try {
       const blob = await generatePlanPacket(store);
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'moonrise-test-loaf-plan.zip';
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     } catch (e) {
       console.error('Export failed', e);
     }
  };

  return (
    <div className="w-80 border-l border-gray-300 bg-white p-4 overflow-y-auto flex flex-col gap-6">
      <div>
        <h3 className="font-bold border-b pb-2 mb-4">Inspector</h3>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500">Net at 10:30</div>
          <div className="text-xl font-bold" data-testid="net-credit">{sample1030?.netCredit}</div>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500">Target</div>
          <div className="text-xl font-bold">{targetReachedAt ? targetReachedAt.substring(11, 16) : 'Unreached'}</div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">Shape Buffer</div>
          <div className="text-xl font-bold">{buffer}m</div>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-sm mb-2 border-b pb-1">Diagnostics</h4>
        {diagnostics.length > 0 ? (
          <div className="flex flex-col gap-2">
            {diagnostics.map(d => (
              <div key={d.id} className={`p-3 rounded text-sm ${d.severity === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-yellow-50 text-yellow-900 border border-yellow-200'}`}>
                <div className="font-bold mb-1">{d.message}</div>
                {d.measured !== undefined && <div>Measured: {d.measured}m (Req: {d.required}m)</div>}
                {d.recoveryText && <div className="mt-2 text-xs opacity-80">{d.recoveryText}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No active diagnostics.</div>
        )}
      </div>

      <div className="flex-1">
        <h4 className="font-bold text-sm mb-2 border-b pb-1">History</h4>
        <div className="flex flex-col gap-1">
          <div className="text-xs text-gray-500 border-b pb-1 mb-1">H-000: Anchor</div>
          {store.history.map(h => (
            <div key={h.id} className={`text-xs p-1 rounded ${!h.active ? 'line-through text-gray-400 bg-gray-50' : 'bg-blue-50'}`}>
              <span className="font-bold">{h.id}</span>: {h.actorId} moved {h.eventId} to {h.to.substring(11, 16)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
         <button onClick={store.validatePlan} className="flex-1 py-2 border rounded bg-gray-50 hover:bg-gray-100 text-sm font-bold">Validate</button>
         <button onClick={store.approvePlan} disabled={diagnostics.length > 0} className="flex-1 py-2 border rounded bg-green-50 hover:bg-green-100 text-sm font-bold disabled:opacity-50">Approve</button>
      </div>

      <button
        className="w-full py-3 bg-black text-white rounded font-bold hover:bg-gray-800 transition-colors"
        onClick={handleExport}
      >
        Export Zip
      </button>
    </div>
  );
};
