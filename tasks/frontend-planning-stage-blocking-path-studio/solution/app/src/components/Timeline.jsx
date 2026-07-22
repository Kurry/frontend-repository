import React from 'react';
import { useStore } from '../store';

export const Timeline = () => {
    const { fixture, currentBeat, setBeat } = useStore();

    return (
        <div className="w-full bg-white border-t border-gray-200 p-4 h-48 overflow-y-auto">
            <h3 className="font-semibold mb-2">Beat Timeline</h3>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 overflow-x-auto pb-4">
                    {Array.from({ length: fixture.totalBeats }).map((_, i) => {
                        const beat = i + 1;
                        const isCurrent = currentBeat === beat;
                        return (
                            <button
                                key={beat}
                                onClick={() => setBeat(beat)}
                                className={`min-w-[40px] h-[40px] flex items-center justify-center rounded text-sm ${isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
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
