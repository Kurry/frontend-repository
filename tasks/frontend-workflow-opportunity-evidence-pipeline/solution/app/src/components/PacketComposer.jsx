import { state, setState } from '../store';
import { For, createMemo, createSignal } from 'solid-js';

export default function PacketComposer(props) {
    const [newBlockText, setNewBlockText] = createSignal('');

    const activeVariant = createMemo(() => {
        return props.opp.variants.find(v => v.id === props.opp.activeVariantId) || props.opp.variants[0];
    });

    const getBoundEvidenceIds = () => {
        return props.opp.bindings.map(b => b.evidenceId);
    };

    const addBlock = () => {
        if (!newBlockText().trim()) return;

        setState(
            'opportunities',
            o => o.id === props.opp.id,
            'variants',
            v => v.id === props.opp.activeVariantId,
            'blocks',
            b => [...b, {
                id: `pb_${Date.now()}`,
                text: newBlockText(),
                evidenceIds: []
            }]
        );
        setNewBlockText('');
    };

    const forkVariant = () => {
        const newId = `v_${Date.now()}`;
        const newVariant = {
            id: newId,
            name: `Variant ${props.opp.variants.length + 1}`,
            blocks: JSON.parse(JSON.stringify(activeVariant().blocks))
        };
        setState('opportunities', o => o.id === props.opp.id, 'variants', v => [...v, newVariant]);
        setState('opportunities', o => o.id === props.opp.id, 'activeVariantId', newId);
    };

    const isBlockUnsupported = (block) => {
        if (block.evidenceIds.length === 0) return true;
        const boundIds = getBoundEvidenceIds();
        return !block.evidenceIds.every(id => boundIds.includes(id));
    };

    return (
        <div class="h-full p-6 overflow-y-auto flex gap-6 bg-white">
            <div class="flex-1 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h2 class="font-semibold text-gray-800">Tailored Resume Blocks</h2>
                    <div class="flex items-center gap-2">
                        <select
                            class="text-sm border rounded p-1"
                            value={props.opp.activeVariantId}
                            onChange={(e) => setState('opportunities', o => o.id === props.opp.id, 'activeVariantId', e.target.value)}
                        >
                            <For each={props.opp.variants}>
                                {(v) => <option value={v.id}>{v.name}</option>}
                            </For>
                        </select>
                        <button onClick={forkVariant} class="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                            Fork Variant
                        </button>
                    </div>
                </div>

                <div class="space-y-4">
                    <For each={activeVariant().blocks}>
                        {(block, index) => {
                            const unsupported = isBlockUnsupported(block);
                            return (
                                <div class={`p-4 rounded-lg border relative ${unsupported ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white shadow-sm'}`}>
                                    {unsupported && (
                                        <div class="absolute -top-3 right-4 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium border border-red-200">
                                            Unsupported Claim
                                        </div>
                                    )}
                                    <textarea
                                        class="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-gray-800 text-sm"
                                        rows="2"
                                        value={block.text}
                                        onInput={(e) => {
                                            setState(
                                                'opportunities',
                                                o => o.id === props.opp.id,
                                                'variants',
                                                v => v.id === props.opp.activeVariantId,
                                                'blocks',
                                                index(),
                                                'text',
                                                e.target.value
                                            );
                                        }}
                                    />

                                    <div class="mt-3 pt-3 border-t border-gray-100 flex gap-2 items-center">
                                        <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Citations:</span>
                                        <For each={block.evidenceIds}>
                                            {(evId) => (
                                                <span class={`text-xs px-2 py-1 rounded-full border ${getBoundEvidenceIds().includes(evId) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                    {evId}
                                                </span>
                                            )}
                                        </For>
                                        <button
                                            class="text-xs text-blue-600 hover:underline ml-auto"
                                            onClick={() => {
                                                setState(
                                                    'opportunities',
                                                    o => o.id === props.opp.id,
                                                    'variants',
                                                    v => v.id === props.opp.activeVariantId,
                                                    'blocks',
                                                    b => b.filter(x => x.id !== block.id)
                                                );
                                            }}
                                        >
                                            Remove Block
                                        </button>
                                    </div>
                                </div>
                            );
                        }}
                    </For>

                    <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <textarea
                            class="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows="2"
                            placeholder="Add a new tailored bullet point..."
                            value={newBlockText()}
                            onInput={(e) => setNewBlockText(e.target.value)}
                        />
                        <div class="mt-2 flex justify-end">
                            <button onClick={addBlock} class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Add Block</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-80 shrink-0 border-l pl-6">
                <h3 class="font-semibold mb-4 text-sm text-gray-500 uppercase tracking-wider">Available Citations</h3>
                <p class="text-xs text-gray-500 mb-4">You can only cite evidence that is bound to a requirement in the Lattice view.</p>
                <div class="space-y-2">
                    <For each={getBoundEvidenceIds()}>
                        {(evId) => {
                            const ev = state.profile.facts.find(f => f.id === evId) || state.profile.artifacts.find(a => a.id === evId);
                            return (
                                <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', evId);
                                    }}
                                    class="p-2 border rounded text-xs bg-white shadow-sm cursor-grab hover:border-blue-300"
                                >
                                    <div class="font-mono text-[10px] text-gray-400 mb-1">{evId}</div>
                                    <div class="truncate">{ev?.text}</div>
                                </div>
                            )
                        }}
                    </For>
                    {getBoundEvidenceIds().length === 0 && (
                        <div class="text-sm text-gray-400 italic">No bound evidence available.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
