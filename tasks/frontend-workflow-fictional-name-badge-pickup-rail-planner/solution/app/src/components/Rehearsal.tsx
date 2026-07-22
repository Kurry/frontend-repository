import { useStore } from '../store';
import { Play, RotateCcw, SkipForward } from 'lucide-react';

export function Rehearsal() {
    const rehearsal = useStore(state => state.rehearsal);
    const stepRehearsal = useStore(state => state.stepRehearsal);
    const resetRehearsal = useStore(state => state.resetRehearsal);

    return (
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm mt-6">
            <h3 className="font-bold mb-4 flex justify-between items-center">
                <span>Check-in Rehearsal</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                    rehearsal.status === 'verified' ? 'bg-green-500/10 text-green-600' :
                    rehearsal.status === 'running' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-muted text-muted-foreground'
                }`}>
                    {rehearsal.status}
                </span>
            </h3>

            <div className="flex justify-between items-center bg-muted/20 p-3 rounded-md border border-border/50 mb-4">
                <div className="text-sm">Cursor: <span className="font-mono">{rehearsal.cursor}/48</span></div>
                <div className="flex gap-2">
                    <button
                        onClick={resetRehearsal}
                        className="p-1.5 rounded hover:bg-muted border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
                        title="Reset Rehearsal"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={stepRehearsal}
                        disabled={rehearsal.status === 'verified'}
                        className="p-1.5 rounded hover:bg-muted border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Step Rehearsal"
                    >
                        <SkipForward size={16} />
                    </button>
                    <button
                        disabled={rehearsal.status === 'verified'}
                        className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        title="Run Rehearsal"
                    >
                        <Play size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 text-sm text-muted-foreground">
                {rehearsal.events.length === 0 ? (
                    <div className="italic text-center py-4 opacity-70">No rehearsal events run.</div>
                ) : (
                    rehearsal.events.map(ev => (
                        <div key={ev.id} className="flex justify-between font-mono text-xs border-b border-border/30 pb-1">
                            <span>{ev.timestamp.split('T')[1].replace('Z', '')}</span>
                            <span className="truncate mx-2">{ev.step}</span>
                            <span>{ev.attendeeId}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
