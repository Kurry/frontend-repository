import { useStore } from '../store';

export function BatchReconciler() {
  const { selectedIds, batchReconcile, undo, history } = useStore();

  const handleReconcile = () => {
    batchReconcile();
  };

  const handleUndo = () => {
    undo();
  };

  return (
    <div className="flex flex-col gap-4 border p-4 bg-white rounded shadow-sm">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-bold">Batch Reconciler</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {selectedIds.length} Selected
        </span>
      </div>

      <p className="text-sm text-gray-600">
        Group selected swatches into a batch and reconcile their aggregate derived totals.
        Records will transition to the <strong>changed</strong> status.
      </p>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleReconcile}
          disabled={selectedIds.length === 0}
          className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Reconcile Batch
        </button>
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Undo Last Mutation
        </button>
      </div>
    </div>
  );
}

export function DerivedSummary() {
  const { derived } = useStore();

  return (
    <div className="flex flex-col gap-3 border p-4 bg-gray-50 rounded shadow-sm mt-4">
      <h3 className="font-bold text-gray-700 border-b pb-1">Derived Summary</h3>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white p-2 rounded shadow-sm border">
          <div className="text-2xl font-bold text-gray-800">{derived.totalCount}</div>
          <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Records</div>
        </div>

        <div className="bg-white p-2 rounded shadow-sm border">
          <div className="text-2xl font-bold text-gray-800">{derived.averageLuminance.toFixed(0)}</div>
          <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Avg Luminance</div>
        </div>

        <div className="bg-white p-2 rounded shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{derived.passesWcagAgainstWhite}</div>
          <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">WCAG Pass (vs #FFF)</div>
        </div>
      </div>
    </div>
  );
}
