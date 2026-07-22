import { useStore } from '../store/store';
import { exportPacket } from '../lib/artifacts';

export function Toolbar() {
  const store = useStore();
  const { viewState, previewMove, previewRepair, events } = store;

  const handlePreviewSave = () => {
    store.previewSaveGuide();
  };

  const setCourse = (increment: number) => {
    useStore.setState((s) => ({
      viewState: {
        ...s.viewState,
        activeCourse: Math.max(1, Math.min(4, s.viewState.activeCourse + increment))
      }
    }));
  };

  const isApproved = events.some(e => e.kind === 'approve_model');

  return (
    <div className="bg-white p-4 shadow flex flex-col gap-4 border-b z-10 sticky top-0">
      <div className="flex gap-4 items-center flex-wrap">
        <h2 className="font-bold text-lg hidden sm:block">Course Composer</h2>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm cursor-pointer"
            onClick={() => setCourse(-1)}
          >
            Course -
          </button>
          <span className="text-sm font-medium">Course {viewState.activeCourse}</span>
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm cursor-pointer"
            onClick={() => setCourse(1)}
          >
            Course +
          </button>
        </div>

        {previewMove ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-bold text-orange-600 animate-pulse">Previewing Move...</span>
            <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm cursor-pointer" onClick={store.cancelMove}>
              Cancel Move
            </button>
            <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm cursor-pointer" onClick={store.commitMove}>
              Confirm Move
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm cursor-pointer" onClick={handlePreviewSave}>
              Save Guide
            </button>
            <button className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm cursor-pointer" onClick={store.approveModel}>
              Approve Model
            </button>
            <button
              className={`px-3 py-1 text-white rounded text-sm cursor-pointer ${isApproved ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={isApproved ? exportPacket : undefined}
              disabled={!isApproved}
            >
              Export Packet
            </button>
          </div>
        )}
      </div>

      {previewRepair && (
        <div className="bg-yellow-100 border border-yellow-300 p-3 rounded flex justify-between items-center text-sm shadow-sm">
          <div>
            <strong>Guide Repair Required:</strong> {previewRepair.description}
          </div>
          <div className="flex gap-2 ml-4">
            <button className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded cursor-pointer" onClick={store.cancelGuideRepair}>
              Cancel Repair
            </button>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer" onClick={store.commitGuideRepair}>
              Confirm Repair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
