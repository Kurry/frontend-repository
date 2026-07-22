import { state, setState } from '../store';
import { createMemo } from 'solid-js';
import LatticeView from './LatticeView';
import PacketComposer from './PacketComposer';
import FitReview from './FitReview';
import TimelineRail from './TimelineRail';

export default function Workspace() {
    const opp = createMemo(() => state.opportunities.find(o => o.id === state.selectedOpportunityId));

    if (!opp()) {
        return <div class="flex-1 flex items-center justify-center text-gray-400">Select an opportunity from the board</div>;
    }

    const downloadDossier = () => {
        const dossier = {
            schemaVersion: "opportunity-evidence-dossier/v1",
            exportedAt: new Date().toISOString(),
            profile: state.profile,
            opportunity: opp()
        };
        const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-${opp().id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div class="flex-1 flex flex-col h-full bg-white relative">
            <div class="h-12 border-b flex items-center px-4 bg-gray-50/50 justify-between shrink-0">
                <div class="flex gap-1 bg-gray-200/50 p-1 rounded-md">
                    <button
                        class={`px-3 py-1 text-sm rounded transition-colors ${state.viewMode === 'lattice' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setState('viewMode', 'lattice')}
                    >
                        Lattice
                    </button>
                    <button
                        class={`px-3 py-1 text-sm rounded transition-colors ${state.viewMode === 'composer' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setState('viewMode', 'composer')}
                    >
                        Packet Composer
                    </button>
                    <button
                        class={`px-3 py-1 text-sm rounded transition-colors ${state.viewMode === 'review' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setState('viewMode', 'review')}
                    >
                        Fit & Review
                    </button>
                </div>

                <div class="flex gap-2">
                    <button onClick={downloadDossier} class="text-sm px-3 py-1.5 bg-gray-800 text-white font-medium rounded shadow-sm hover:bg-gray-700 transition-colors">
                        Export Dossier
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-hidden flex">
                <div class="flex-1 overflow-hidden relative">
                    <div class={`absolute inset-0 transition-opacity duration-200 ${state.viewMode === 'lattice' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                        <LatticeView opp={opp()} />
                    </div>
                    <div class={`absolute inset-0 transition-opacity duration-200 ${state.viewMode === 'composer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                        <PacketComposer opp={opp()} />
                    </div>
                    <div class={`absolute inset-0 transition-opacity duration-200 ${state.viewMode === 'review' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                        <FitReview opp={opp()} />
                    </div>
                </div>

                <div class="w-64 shrink-0">
                    <TimelineRail opp={opp()} />
                </div>
            </div>
        </div>
    );
}
