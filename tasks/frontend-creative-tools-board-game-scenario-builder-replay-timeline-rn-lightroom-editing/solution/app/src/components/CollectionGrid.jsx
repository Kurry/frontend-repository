import { createMemo } from 'solid-js';
import { store, setActiveRecord, setFilterStatus } from '../store';

export default function CollectionGrid() {
  const filteredRecords = createMemo(() => {
    if (store.filterStatus === 'all') return store.records;
    return store.records.filter(r => r.status === store.filterStatus);
  });

  return (
    <div class="flex flex-col h-full border-r border-gray-200 w-full md:w-64 bg-gray-50 shrink-0">
      <div class="p-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-700 mb-2">Scenario Cards</h2>
        <select
          class="w-full p-2 border border-gray-300 rounded text-sm"
          value={store.filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="conflict">Conflict</option>
          <option value="empty">Empty</option>
        </select>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        {filteredRecords().length === 0 ? (
          <div class="p-4 text-sm text-gray-500 text-center">No scenario cards found for this filter. To add one, use the "New Scenario" action.</div>
        ) : (
          filteredRecords().map((record) => (
            <div
              class={`p-3 mb-2 rounded cursor-pointer border ${store.activeRecordId === record.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setActiveRecord(record.id)}
            >
              <div class="font-medium text-sm truncate" title={record.title}>{record.title}</div>
              <div class="flex justify-between items-center mt-1">
                <span class={`text-xs px-2 py-0.5 rounded-full ${
                  record.status === 'ready' ? 'bg-green-100 text-green-800' :
                  record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                  record.status === 'conflict' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
