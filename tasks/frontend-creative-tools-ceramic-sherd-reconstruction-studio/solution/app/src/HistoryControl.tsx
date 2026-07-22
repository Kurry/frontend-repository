import { useGlobalStore } from "./store";

export function HistoryControl() {
  const { state, dispatch } = useGlobalStore();

  return (
    <div className="p-4 bg-slate-50 border rounded flex flex-col gap-3">
      <h3 className="font-bold">History & Branching</h3>
      <div className="flex gap-2">
         <button onClick={() => dispatch({ type: "UNDO" })} className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300">Undo</button>
         <button onClick={() => dispatch({ type: "REDO" })} className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300">Redo</button>
         <button onClick={() => dispatch({ type: "CREATE_BRANCH", fromRevisionId: state.currentRevisionId })} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Fork Branch</button>
      </div>
      {state.branches.length > 0 && (
        <div className="text-xs text-slate-500">
           Active Branches: {state.branches.length}
        </div>
      )}
    </div>
  );
}
