import React from 'react';
import { useStore } from '../store/useStore';

export function FindingsLedger() {
  const observations = useStore((state) => state.observations);
  const selectedFixtures = useStore((state) => state.selectedFixtures);

  const filteredObservations = selectedFixtures.length > 0
    ? observations.filter(o => selectedFixtures.includes(o.fixtureId))
    : observations;

  return (
    <div className="border border-border rounded-lg bg-card p-4 h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Findings & Evidence</h3>
        <span className="text-xs bg-muted px-2 py-1 rounded-full">{filteredObservations.length} Items</span>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-2">
        {filteredObservations.map((obs) => (
          <div key={obs.id} className="p-3 border border-border rounded flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="w-16 h-16 bg-muted rounded flex flex-col items-center justify-center shrink-0 border border-border">
              <span className="text-[10px] text-muted-foreground break-all px-1 text-center font-mono leading-tight">{obs.evidenceHash.substring(0,8)}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm flex items-center gap-2">
                  Obs {obs.id}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                    obs.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                    obs.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {obs.severity}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">T: {obs.capturedAt}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Fixture: {obs.fixtureId}</div>
              <div className="text-sm mt-1 text-card-foreground line-clamp-1">{obs.note}</div>
            </div>
          </div>
        ))}
        {filteredObservations.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No findings for selected fixtures.
          </div>
        )}
      </div>
    </div>
  );
}
