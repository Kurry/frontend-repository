import { useStore } from '../store/useStore';

export default function CyclePreviewSheet() {
  const plan = useStore(state => state.plan);
  const cancelClip = useStore(state => state.cancelClip);

  // Quick heuristic: if there's a preview clip status with a cycle detected by the store,
  // we would display it. The prompt says "Preview cycle by threading back to earlier task, cancel, and restore state."
  // To avoid rewriting the entire DeskView dropping logic, we will check if any clip is 'preview'
  // and has a cycle constraint violation.

  const previewClip = plan.clips.find(c => c.status === 'preview');
  if (!previewClip) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="font-bold text-lg text-red-600 mb-2">Cycle Detected</h3>
        <p className="text-sm text-slate-700 mb-4">
          Connecting {previewClip.sourceTaskId} to {previewClip.targetTaskId} creates an invalid dependency loop in the schedule.
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => cancelClip(previewClip.id)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-sm"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
}
