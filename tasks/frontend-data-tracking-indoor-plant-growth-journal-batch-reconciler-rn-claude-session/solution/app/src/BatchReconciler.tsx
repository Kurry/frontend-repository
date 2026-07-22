import { useJournalStore } from './store';

export function BatchReconciler({ selectedIds, clearSelection }: { selectedIds: string[], clearSelection: () => void }) {
  const batchReconcile = useJournalStore(state => state.batchReconcile);
  const derived = useJournalStore(state => state.derived);
  const undo = useJournalStore(state => state.undo);
  const history = useJournalStore(state => state.history);

  const handleReconcile = () => {
    if (selectedIds.length > 0) {
      batchReconcile(selectedIds);
      clearSelection();
    }
  };

  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg border border-border mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300">
      <div>
        <h2 className="text-xl font-bold">Batch Reconciler</h2>
        <p className="text-muted-foreground">{selectedIds.length} records selected</p>
        <p className="text-sm mt-1"><strong>Summary:</strong> {derived.summary}</p>
      </div>
      <div className="flex gap-2">
         <button
           onClick={handleReconcile}
           disabled={selectedIds.length === 0}
           className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
         >
           Reconcile Selected
         </button>
         <button
           onClick={undo}
           disabled={history.length === 0}
           className="border px-4 py-2 rounded disabled:opacity-50"
         >
           Undo Last Action
         </button>
      </div>
    </div>
  );
}
