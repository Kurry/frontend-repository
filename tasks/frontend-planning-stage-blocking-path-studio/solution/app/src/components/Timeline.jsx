import React from 'react';
import { useStore } from '../store';

export const Timeline = () => {
    const { fixture, currentBeat, setBeat, score, activeTool, addRehearsalEvent } = useStore();
    const branch = score.branches[score.activeBranch];

    // Check if empty collection
    const isEmpty = Object.keys(branch.waypoints).length === 0;

    const handleRehearsalAction = (action) => {
        addRehearsalEvent({ id: `rehearsal-${Date.now()}`, beat: currentBeat, status: action, at: new Date().toISOString() });
        if (action === 'restart') setBeat(1);
        if (action === 'advance') setBeat(Math.min(fixture.totalBeats, currentBeat + 1));
    };

    return (
        <div className="w-full bg-white border-t border-gray-200 p-4 h-48 overflow-y-auto overflow-x-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">Beat Timeline</h2>

                {activeTool === 'rehearsal' && (
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
                        {['start', 'pause', 'advance', 'stop', 'restart'].map(action => (
                            <button
                                key={action}
                                onClick={() => handleRehearsalAction(action)}
                                className="min-h-[44px] px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 capitalize"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isEmpty && (
                <div className="text-gray-500 italic mb-2">
                    No waypoints added yet. Select a tool above to start placing actors.
                </div>
            )}

            <div className="flex flex-col gap-2 w-full overflow-x-auto">
                <div className="flex items-center gap-2 pb-4 min-w-max">
                    {Array.from({ length: fixture.totalBeats }).map((_, i) => {
                        const beat = i + 1;
                        const isCurrent = currentBeat === beat;
                        return (
                            <button
                                key={beat}
                                onClick={() => setBeat(beat)}
                                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCurrent ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                {beat}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
