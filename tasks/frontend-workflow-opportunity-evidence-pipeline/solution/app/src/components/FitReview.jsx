import { createMemo, For } from 'solid-js';

export default function FitReview(props) {
    const activeVariant = createMemo(() => {
        return props.opp.variants.find(v => v.id === props.opp.activeVariantId) || props.opp.variants[0];
    });

    const analysis = createMemo(() => {
        const mustHaves = props.opp.requirements.filter(r => r.class === 'must-have');
        const coveredMustHaves = mustHaves.filter(req => props.opp.bindings.some(b => b.reqId === req.id));

        const variantBlocks = activeVariant().blocks;
        const unsupportedBlocks = variantBlocks.filter(b => {
            if (b.evidenceIds.length === 0) return true;
            const boundIds = props.opp.bindings.map(bd => bd.evidenceId);
            return !b.evidenceIds.every(id => boundIds.includes(id));
        });

        let status = 'ready';
        let messages = [];

        if (coveredMustHaves.length < mustHaves.length) {
            status = 'needs-evidence';
            messages.push(`${mustHaves.length - coveredMustHaves.length} Must-Have requirements are missing evidence.`);
        }

        if (unsupportedBlocks.length > 0) {
            status = 'needs-edit';
            messages.push(`${unsupportedBlocks.length} packet blocks contain unsupported claims.`);
        }

        return { status, messages, coverage: (coveredMustHaves.length / (mustHaves.length || 1)) * 100 };
    });

    return (
        <div class="h-full p-8 max-w-3xl mx-auto flex flex-col gap-8">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Fit & Integrity Review</h2>
                <p class="text-gray-500">Automated deterministic review of your evidence bindings and tailored packet ({activeVariant().name}).</p>
            </div>

            <div class={`p-6 rounded-xl border-2 ${
                analysis().status === 'ready' ? 'bg-green-50 border-green-200' :
                analysis().status === 'needs-evidence' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
            }`}>
                <div class="flex items-center gap-4 mb-4">
                    <div class={`text-lg font-bold uppercase tracking-wider ${
                        analysis().status === 'ready' ? 'text-green-700' :
                        analysis().status === 'needs-evidence' ? 'text-yellow-700' :
                        'text-red-700'
                    }`}>
                        {analysis().status.replace('-', ' ')}
                    </div>
                </div>

                <div class="space-y-2">
                    <For each={analysis().messages}>
                        {(msg) => <div class="text-sm font-medium text-gray-800 flex items-center gap-2"><span>•</span> {msg}</div>}
                    </For>
                    {analysis().messages.length === 0 && (
                        <div class="text-sm font-medium text-green-800">All must-have requirements are covered and all claims are supported.</div>
                    )}
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Coverage Metrics</h3>
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>Must-Have Coverage</span>
                        <span class="font-medium">{analysis().coverage.toFixed(0)}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-600 transition-all" style={{ width: `${analysis().coverage}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
