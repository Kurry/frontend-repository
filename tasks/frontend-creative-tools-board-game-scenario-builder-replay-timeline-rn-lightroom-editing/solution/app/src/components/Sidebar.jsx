import { createMemo } from 'solid-js';
import { store, setActiveRecord } from '../store';

export default function Sidebar() {
  const activeRecord = createMemo(() => store.records.find(r => r.id === store.activeRecordId));

  return (
    <div class="flex flex-col h-full border-l border-gray-200 w-full md:w-72 bg-white shrink-0 p-4 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-700">Inspector</h2>
        <button
          class="md:hidden text-sm text-blue-600 hover:underline"
          onClick={() => setActiveRecord(null)}
        >
          Back to List
        </button>
      </div>

      {activeRecord() ? (
        <div class="space-y-4 text-sm pb-10">
          <div>
            <span class="block text-gray-500 text-xs font-semibold uppercase mb-1">ID</span>
            <div class="text-gray-900">{activeRecord().id}</div>
          </div>
          <div>
            <span class="block text-gray-500 text-xs font-semibold uppercase mb-1">Status</span>
            <div class="text-gray-900 capitalize">{activeRecord().status}</div>
          </div>
          <div>
            <span class="block text-gray-500 text-xs font-semibold uppercase mb-1">Derived Summary</span>
            <div class="text-gray-900 p-2 bg-gray-50 rounded border border-gray-100 whitespace-pre-wrap break-words">
              {activeRecord().derived?.summary || 'No summary available.'}
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200">
            <span class="block text-gray-500 text-xs font-semibold uppercase mb-2">History Checkpoints</span>
            <div class="space-y-2">
              {activeRecord().history?.map((h, index) => (
                <div class="flex items-center text-xs p-2 bg-gray-50 rounded border border-gray-100">
                  <div class="w-6 text-gray-400 shrink-0">#{index}</div>
                  <div class="flex-1">
                    <span class="font-medium text-gray-700">T: {h.state.timelineState}%</span>
                  </div>
                  <div>
                    <span class="text-gray-500 capitalize">{h.state.status}</span>
                  </div>
                </div>
              ))}
              {(!activeRecord().history || activeRecord().history.length === 0) && (
                <div class="text-gray-500 italic">No history recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div class="text-sm text-gray-500 text-center mt-10">
          Select a scenario card to inspect its details and derived state.
        </div>
      )}
    </div>
  );
}
