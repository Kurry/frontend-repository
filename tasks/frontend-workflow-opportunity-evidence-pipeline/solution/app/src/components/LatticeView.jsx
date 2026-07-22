import { state, setState } from '../store';
import { For } from 'solid-js';

export default function LatticeView(props) {
    const handleDragStart = (e, evidenceId) => {
        e.dataTransfer.setData('text/plain', evidenceId);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e, reqId) => {
        e.preventDefault();
        const evidenceId = e.dataTransfer.getData('text/plain');
        if (!evidenceId) return;

        // Prevent duplicate binding for the same requirement
        if (props.opp.bindings.some(b => b.reqId === reqId && b.evidenceId === evidenceId)) {
            return;
        }

        setState('opportunities', oppIndex => state.opportunities[oppIndex].id === props.opp.id, 'bindings', b => [...b, {
            reqId,
            evidenceId,
            type: 'direct' // default
        }]);
    };

    const removeBinding = (reqId, evidenceId) => {
        setState('opportunities', oppIndex => state.opportunities[oppIndex].id === props.opp.id, 'bindings', b => b.filter(binding => !(binding.reqId === reqId && binding.evidenceId === evidenceId)));
    };

    const getEvidenceById = (id) => {
        return state.profile.facts.find(f => f.id === id) || state.profile.artifacts.find(a => a.id === id) || state.profile.skills.find(s => s.id === id);
    };

    return (
        <div class="h-full flex">
            {/* Left side: Requirements */}
            <div class="w-1/2 border-r p-6 overflow-y-auto bg-gray-50/30">
                <h2 class="font-semibold mb-4 text-gray-800">Opportunity Requirements</h2>
                <div class="space-y-4">
                    <For each={props.opp.requirements}>
                        {(req) => (
                            <div
                                class="bg-white p-4 rounded-lg border shadow-sm"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, req.id)}
                            >
                                <div class="flex justify-between items-start mb-2">
                                    <span class="font-medium text-gray-900">{req.text}</span>
                                    <span class={`text-xs px-2 py-1 rounded-full font-medium
                                        ${req.class === 'must-have' ? 'bg-red-100 text-red-700' :
                                          req.class === 'preferred' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'}
                                    `}>
                                        {req.class}
                                    </span>
                                </div>

                                {/* Bound evidence */}
                                <div class="mt-3 space-y-2">
                                    <h4 class="text-xs font-semibold text-gray-400 uppercase">Bound Evidence</h4>
                                    <div class="min-h-[40px] bg-gray-50 border border-dashed border-gray-200 rounded p-2 flex flex-col gap-2">
                                        <For each={props.opp.bindings.filter(b => b.reqId === req.id)}>
                                            {(binding) => {
                                                const ev = getEvidenceById(binding.evidenceId);
                                                return (
                                                    <div class="bg-white border rounded p-2 text-sm flex justify-between items-center shadow-sm">
                                                        <span class="truncate pr-2" title={ev?.text}>{ev?.text}</span>
                                                        <div class="flex gap-2 items-center shrink-0">
                                                            <select
                                                                class="text-xs border rounded p-1 bg-gray-50"
                                                                value={binding.type}
                                                                onChange={(e) => {
                                                                    const oppIndex = state.opportunities.findIndex(o => o.id === props.opp.id);
                                                                    const bindIndex = state.opportunities[oppIndex].bindings.findIndex(b => b.reqId === req.id && b.evidenceId === binding.evidenceId);
                                                                    setState('opportunities', oppIndex, 'bindings', bindIndex, 'type', e.target.value);
                                                                }}
                                                            >
                                                                <option value="direct">Direct</option>
                                                                <option value="transferable">Transferable</option>
                                                                <option value="contextual">Contextual</option>
                                                                <option value="gap">Gap</option>
                                                            </select>
                                                            <button onClick={() => removeBinding(req.id, binding.evidenceId)} class="text-red-500 hover:text-red-700 p-1">×</button>
                                                        </div>
                                                    </div>
                                                )
                                            }}
                                        </For>
                                        {props.opp.bindings.filter(b => b.reqId === req.id).length === 0 && (
                                            <div class="text-xs text-gray-400 text-center py-2">Drag evidence here</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>

            {/* Right side: Profile Evidence */}
            <div class="w-1/2 p-6 overflow-y-auto bg-gray-100/50">
                <h2 class="font-semibold mb-4 text-gray-800">Your Evidence Library</h2>

                <div class="space-y-6">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Experience Facts</h3>
                        <div class="space-y-2">
                            <For each={state.profile.facts}>
                                {(fact) => (
                                    <div
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, fact.id)}
                                        class="bg-white p-3 rounded border shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
                                    >
                                        <div class="text-sm">{fact.text}</div>
                                        <div class="text-xs text-green-600 font-medium mt-1">{fact.metric} • {fact.date}</div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
