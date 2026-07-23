import { useStore } from '../store/useStore';
import { GitBranch, MessageSquare, Undo2, Redo2 } from 'lucide-react';

export default function BranchCompare() {
  const plan = useStore(state => state.plan);
  const undoActorEvent = useStore(state => state.undoActorEvent);
  const redoActorEvent = useStore(state => state.redoActorEvent);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded shadow-sm m-8 max-w-sm">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-600" />
          History & Branches
        </h3>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          {plan.branchId}
        </span>
      </div>

      <div className="flex gap-2 mb-2 border-b pb-2">
        <button onClick={() => undoActorEvent('Ari')} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200"><Undo2 className="w-3 h-3"/> Undo Ari</button>
        <button onClick={() => redoActorEvent('Ari')} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200"><Redo2 className="w-3 h-3"/> Redo Ari</button>
      </div>

      <div className="flex flex-col gap-3 max-h-48 overflow-auto text-sm">
        <div className="flex gap-2">
          <div className="w-1 bg-slate-200 rounded-full my-1 relative flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 absolute -ml-[2px]" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-slate-800">Current State</div>
            <div className="text-xs text-slate-500">{plan.history.currentEventId || 'No events'}</div>
          </div>
        </div>

        {plan.comments.map(comment => (
          <div key={comment.id} className="flex gap-2 mt-2">
            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded text-xs">
              <div className="font-medium text-slate-700">{comment.actorId}</div>
              <div className="text-slate-600 mt-1">{comment.text}</div>
              <div className="mt-2 text-slate-400 font-mono text-[10px]">Anchors: {comment.anchorIds.join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
