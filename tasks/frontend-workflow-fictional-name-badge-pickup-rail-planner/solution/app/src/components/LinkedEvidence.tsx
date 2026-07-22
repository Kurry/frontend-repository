import { useStore } from '../store';

export function LinkedEvidence() {
    const profile = useStore(state => state.profile);
    const issues = useStore(state => state.issues);
    const setBrush = useStore(state => state.setBrush);
    const arrivalBrush = useStore(state => state.arrivalBrush);

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <h3 className="font-bold mb-2 flex justify-between">
                    <span>Arrival Timeline & Profile</span>
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                        1..48 arrivals
                    </span>
                </h3>
                <div
                    className="h-16 bg-muted/30 rounded flex items-end overflow-hidden cursor-crosshair border border-border/50 relative"
                    onClick={() => setBrush({ startSequence: 1, endSequence: 48 })}
                >
                    {/* Simulated histogram */}
                    {Array.from({ length: 48 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 mx-[1px] rounded-t transition-colors ${arrivalBrush && i >= arrivalBrush.startSequence - 1 && i <= arrivalBrush.endSequence - 1 ? 'bg-primary/80' : 'bg-primary/20'}`}
                            style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Redirects</div>
                        <div className="text-2xl font-semibold font-mono">{profile.redirects}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Route Steps</div>
                        <div className="text-2xl font-semibold font-mono">{profile.routeSteps}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md border border-border/50">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Predicted</div>
                        <div className="text-sm font-semibold font-mono mt-1">{new Date(profile.predictedCompletion).toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <h3 className="font-bold mb-4">Issue Graph</h3>
                <div className="space-y-3">
                    {issues.map(iss => (
                        <div key={iss.id} className={`p-3 border rounded-md ${iss.status === 'open' ? 'border-destructive/40 bg-destructive/5' : 'border-green-500/40 bg-green-500/5'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <div className="font-semibold text-sm">{iss.title}</div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${iss.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                                    {iss.status}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{iss.description}</div>
                            <div className="mt-2 flex gap-1">
                                {iss.affectedIds.map(id => (
                                    <span key={id} className="text-[10px] font-mono bg-background border px-1 rounded">{id}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {issues.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">No tracked issues.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
