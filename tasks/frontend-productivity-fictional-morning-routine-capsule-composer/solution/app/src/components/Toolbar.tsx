import { useStore } from '../store';
import { createExportPacket, processImportPacket } from '../exportImport';

export function Toolbar() {
  const {
    sessionState,
    history,
    nestRequest,
    cancelNest,
    previewSaveRepair,
    undoActorAction,
    redoActorAction,
    addNote,
    validateRoutine,
    approveRoutine
  } = useStore();

  const handleExport = async () => {
    createExportPacket(sessionState, history, useStore.getState().viewState);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex gap-2">
        {nestRequest && (
           <>
             <button
               className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium focus:ring-2 focus:ring-red-500"
               onClick={cancelNest}
             >
               Cancel Nest
             </button>
             <button
               className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
               onClick={previewSaveRepair}
             >
               Save Routine
             </button>
           </>
        )}
        {!nestRequest && (
           <button
             className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium focus:ring-2 focus:ring-gray-500"
             onClick={validateRoutine}
           >
             Validate
           </button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <button
          className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium"
          onClick={undoActorAction}
          title="Undo Ari"
        >
          Undo Ari
        </button>
        <button
          className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium"
          onClick={redoActorAction}
          title="Redo Ari"
        >
          Redo Ari
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm font-medium"
          onClick={() => addNote('STEP-05', 'Scarf and pocket stay adjacent')}
        >
          Sol Note
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          className={`px-3 py-1.5 rounded text-sm font-medium ${sessionState.validation ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          onClick={approveRoutine}
          disabled={!sessionState.validation}
        >
          Approve
        </button>
        <button
          className={`px-3 py-1.5 rounded text-sm font-medium ${sessionState.status === 'approved' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          onClick={handleExport}
          disabled={sessionState.status !== 'approved'}
        >
          Export
        </button>
        <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium cursor-pointer">
          Import
          <input type="file" className="hidden" accept=".zip" onChange={(e) => { if(e.target.files?.[0]) processImportPacket(e.target.files[0]); }} />
        </label>
      </div>
    </div>
  );
}
