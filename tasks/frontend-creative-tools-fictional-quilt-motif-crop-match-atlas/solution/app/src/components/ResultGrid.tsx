import React from 'react';
import { useStore } from '../store/useStore';

export const ResultGrid = () => {
  const { globalRanking, filters, selectCandidate, selectedMotifId } = useStore();

  const visibleMatches = globalRanking.filter(m => {
    if (filters.family && m.family && m.family !== filters.family) return false;
    return true;
  });

  if (globalRanking.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No matches generated yet. Make a crop to search.</div>;
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="font-semibold text-sm">Results ({visibleMatches.length} / {globalRanking.length})</div>
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 p-1">
        {visibleMatches.slice(0, 50).map(match => (
          <button
            key={match.motifId}
            onClick={() => selectCandidate(match.motifId)}
            className={`flex items-center gap-3 p-2 border rounded-lg text-left transition-colors ${
              selectedMotifId === match.motifId
                ? 'bg-primary/10 border-primary shadow-sm'
                : 'bg-card hover:bg-accent/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center w-8 bg-muted rounded p-1 font-mono text-xs">
              <span className="text-muted-foreground">#{match.rank}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{match.motifId}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {match.distance}/64 • {match.bestTransform}
              </div>
            </div>

            {match.decisionStatus === 'supported' && (
              <div className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-500/20 text-green-700 dark:text-green-400 rounded">
                Accepted
              </div>
            )}
            {match.decisionStatus === 'tentative' && (
              <div className="px-2 py-0.5 text-[10px] uppercase font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded">
                Tentative
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
