import { useStore } from '../store';
import { Undo2, Redo2, GitBranch } from 'lucide-react';

export function History() {
    const history = useStore(state => state.history);
    const comments = useStore(state => state.comments);
    const undoEvent = useStore(state => state.undoEvent);
    const redoEvent = useStore(state => state.redoEvent);

    return (
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm mt-6">
            <h3 className="font-bold mb-4 flex justify-between items-center">
                <span>History & Comments</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                        <GitBranch size={12} />
                        Baseline
                    </span>
                </div>
            </h3>

            <div className="flex gap-2 mb-4 border-b border-border pb-4">
                <button
                    onClick={undoEvent}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted border border-border transition-colors text-sm font-medium"
                >
                    <Undo2 size={16} /> Undo
                </button>
                <button
                    onClick={redoEvent}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted border border-border transition-colors text-sm font-medium"
                >
                    <Redo2 size={16} /> Redo
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actor Comments</h4>
                    {comments.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">No comments yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-sm">
                                    <div className="flex justify-between items-start mb-1 text-xs">
                                        <span className="font-bold text-amber-700">{c.actorId}</span>
                                        <span className="text-muted-foreground font-mono">{new Date(c.logicalTime).toLocaleTimeString()}</span>
                                    </div>
                                    <div>{c.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                        Event Log
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{history.events.length}</span>
                    </h4>
                    <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {history.events.map(ev => (
                            <div key={ev.id} className="flex gap-2 text-xs py-1 border-b border-border/30 last:border-0">
                                <span className="font-mono text-muted-foreground whitespace-nowrap">
                                    {new Date(ev.logicalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                </span>
                                <span className="font-semibold text-primary/80 w-12">{ev.actorId}</span>
                                <span className="truncate">{ev.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
