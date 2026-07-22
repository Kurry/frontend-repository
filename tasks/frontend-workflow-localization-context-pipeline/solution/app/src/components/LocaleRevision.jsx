import { store, submitReview, approve } from "../store";

export default function LocaleRevision() {
  const target = () => store.targetRevisions[store.activeUnitId]?.[store.activeLocale];

  return (
    <div class="border border-border rounded-lg bg-surface p-4 mt-4">
      <h3 class="font-semibold text-md mb-2">Revision & Lineage</h3>
      <div class="space-y-4">
        <div>
          <div class="text-sm font-medium text-gray-700">Draft Status:</div>
          <div class="text-sm text-gray-600">
            {target()?.draft ? (target().draft.isInvalid ? <span class="text-red-500">Invalid</span> : "Valid Draft") : "No Draft"}
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
            onClick={() => submitReview(store.activeUnitId, store.activeLocale)}
            disabled={!target()?.draft || target()?.draft?.isInvalid}
          >
            Submit for Review
          </button>

          <button
            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
            onClick={() => approve(store.activeUnitId, store.activeLocale)}
            disabled={!target()?.reviewed}
          >
            Approve
          </button>
        </div>

        <div class="mt-4 pt-4 border-t border-border">
          <div class="text-sm font-medium text-gray-700 mb-2">History:</div>
          <ul class="text-xs text-gray-500 space-y-1">
             {target()?.history?.map((h, i) => (
                <li key={i}>{h.type} at {new Date(h.data.timestamp).toLocaleTimeString()}</li>
             ))}
             {(!target()?.history || target().history.length === 0) && <li>No history</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
