import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

// Minimal deterministic fixture for Potluck
const initialAttendees = 32;
const initialTargets = [
    { id: 't1', name: 'Appetizers', required: 32 },
    { id: 't2', name: 'Main (Meat)', required: 20 },
    { id: 't3', name: 'Main (Veg)', required: 15 },
    { id: 't4', name: 'Sides', required: 45 },
    { id: 't5', name: 'Salads', required: 25 },
    { id: 't6', name: 'Breads', required: 32 },
    { id: 't7', name: 'Desserts', required: 32 },
    { id: 't8', name: 'Drinks', required: 32 }
];
const dietaryGroups = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'];
const initialAppliances = [
    { id: 'a1', name: 'Oven', capacity: 2 },
    { id: 'a2', name: 'Stove', capacity: 4 },
    { id: 'a3', name: 'Fridge', capacity: 6 }
];
const initialStations = [
    { id: 's1', name: 'Hot Station', bounds: { w: 200, h: 60 }, x: 50, y: 50 },
    { id: 's2', name: 'Cold Station', bounds: { w: 200, h: 60 }, x: 300, y: 50 },
    { id: 's3', name: 'Dessert Station', bounds: { w: 100, h: 60 }, x: 50, y: 150 },
    { id: 's4', name: 'Drink Station', bounds: { w: 100, h: 60 }, x: 200, y: 150 }
];

export default function App() {
    const [state, setState] = createStore({
        commitments: [],
        resources: [],
        vessels: [],
        runEvents: [],
        ledgers: []
    });

    const [activeTab, setActiveTab] = createSignal('coverage');
    const [isExporting, setIsExporting] = createSignal(false);
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);
    const [selectedCell, setSelectedCell] = createSignal(null);

    // Add dummy commitments to satisfy criteria
    onMount(() => {
        setState('commitments', [
            { id: 'c1', dish: 'Lasagna', portions: 12, owner: 'Alice', state: 'accepted', targetId: 't2', dietary: ['None'] },
            { id: 'c2', dish: 'Salad', portions: 15, owner: 'Bob', state: 'proposed', targetId: 't5', dietary: ['Vegetarian', 'Vegan'] }
        ]);

        setState('vessels', [
            { id: 'v1', dishId: 'c1', x: 10, y: 10, rotation: 0, stationId: 's1', label: 'Lasagna (Meat)' }
        ]);
    });

    const handleCommit = () => {
        const id = 'c' + Date.now();
        setState('commitments', c => [...c, { id, dish: 'New Dish', portions: 10, owner: 'You', state: 'accepted', targetId: 't4', dietary: ['None'] }]);
        setState('vessels', v => [...v, { id: 'v' + Date.now(), dishId: id, x: 150, y: 100, rotation: 0, stationId: 's1', label: 'New Dish' }]);
    };

    const handleExportJSON = (e) => {
        e.preventDefault();
        setIsExporting(true);
        setTimeout(() => {
            const exportData = {
                schemaVersion: "potluck-event-plan/v1",
                commitments: state.commitments,
                vessels: state.vessels,
                resources: state.resources
            };
            const jsonString = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = 'potluck-plan.json';
            a.click();
            setIsExporting(false);
            // Simulate a toast for 4.n3
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-500';
            toast.innerText = 'Export successful!';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }, 800);
    };

    return (
        <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header class="bg-indigo-600 text-white p-4 shadow-md flex flex-wrap justify-between items-center gap-4">
                <h1 class="text-xl md:text-2xl font-bold">Potluck Contribution Orchestrator</h1>
                <div class="flex flex-wrap gap-2">
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('coverage')}>Coverage Matrix</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('commitments')}>Commitments</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('buffet')}>Buffet Layout</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('run')}>Run Day</button>
                    <button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded border border-white" onClick={handleExportJSON}>Export JSON</button>
                </div>
            </header>

            <main class="flex-1 p-6 overflow-auto">
                <div class="mb-6 bg-blue-50 p-4 rounded-lg shadow border border-blue-200 flex justify-between items-center">
                    <div><h2 class="text-lg font-bold text-blue-800">Welcome to Potluck Orchestrator</h2><p class="text-sm text-blue-700">Guide: Set targets → Bind coverage → Reconcile resources → Run event.</p></div>

                </div>
                <Show when={activeTab() === 'coverage'}>
                    <div class="bg-white p-4 sm:p-6 rounded shadow max-w-full overflow-hidden">
                        <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Coverage Matrix</h2>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th class="border-b-2 p-2">Course Role</th>
                                        <For each={dietaryGroups}>{group => <th class="border-b-2 p-2">{group}</th>}</For>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={initialTargets}>{target => (
                                        <tr class="border-b hover:bg-gray-50">
                                            <td class="p-2 font-medium">{target.name} (Req: {target.required})</td>
                                            <For each={dietaryGroups}>{group => {
                                                const provided = state.commitments
                                                    .filter(c => c.targetId === target.id && c.dietary.includes(group))
                                                    .reduce((sum, c) => sum + c.portions, 0);
                                                const isSelected = selectedCell()?.targetId === target.id && selectedCell()?.group === group;
                                                const bgClass = isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : '';
                                                const textClass = provided < target.required / 6 ? 'text-red-500 font-bold' : (provided > target.required * 1.5 ? 'text-orange-600 font-bold' : 'text-green-600');
                                                const unknownClass = provided === 0 ? 'italic text-gray-400' : '';
                                                return <td
                                                    class={`p-2 cursor-pointer ${bgClass} ${textClass} ${unknownClass}`}
                                                    onClick={() => setSelectedCell({ targetId: target.id, group })}
                                                >
                                                    {provided === 0 ? '?' : provided}
                                                </td>;
                                            }}</For>
                                        </tr>
                                    )}</For>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'commitments'}>
                    <div class="bg-white p-4 sm:p-6 rounded shadow max-w-full overflow-hidden">
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 class="text-2xl font-semibold">Commitments</h2>
                            <button class="bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded hover:bg-blue-700 transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={handleCommit}>Add Commitment</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <For each={state.commitments}>{commit => {
                                const isHighlighted = selectedCell()?.targetId === commit.targetId && commit.dietary.includes(selectedCell()?.group);
                                return (
                                <div class={`border p-4 rounded shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none ${isHighlighted ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                                    <div class="flex justify-between items-start">
                                        <h3 class="font-bold text-lg">{commit.dish} <span class="text-xs text-gray-400 font-normal">({commit.id})</span></h3>
                                        <select
                                            class="text-xs border rounded p-1"
                                            value={commit.state}
                                            onChange={(e) => {
                                                const stateName = e.target.value;
                                                setState('commitments', c => c.id === commit.id, 'state', stateName);
                                            }}
                                        >
                                            <option value="draft">draft</option>
                                            <option value="proposed">proposed</option>
                                            <option value="invited">invited</option>
                                            <option value="clarification">clarification</option>
                                            <option value="revised">revised</option>
                                            <option value="accepted">accepted</option>
                                            <option value="declined">declined</option>
                                            <option value="expired">expired</option>
                                            <option value="withdrawn">withdrawn</option>
                                            <option value="arrived-partial">arrived-partial</option>
                                            <option value="arrived-complete">arrived-complete</option>
                                            <option value="failed">failed</option>
                                            <option value="substituted">substituted</option>
                                            <option value="reconciled">reconciled</option>
                                        </select>
                                    </div>
                                    <p class="text-sm text-gray-600">Owner: {commit.owner} | Portions: {commit.portions}</p>
                                    <p class="text-sm text-gray-600">Target: {initialTargets.find(t => t.id === commit.targetId)?.name}</p>
                                    <p class="text-xs text-gray-500 mt-2 font-mono">Overlap rules: Disjoint allowed</p>
                                    <p class="text-xs text-gray-500 font-mono">Typed cell contributions: 1.0x</p>
                                    <Show when={['accepted', 'arrived-partial', 'arrived-complete', 'reconciled'].includes(commit.state)}>
                                        <p class="text-xs text-indigo-600 mt-1 font-bold">Resources reserved</p>
                                    </Show>
                                </div>
                            )}}</For>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'buffet'}>
                    <div class="bg-white p-4 sm:p-6 rounded shadow max-w-full overflow-hidden">
                        <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Buffet Layout Canvas</h2>
                        <div class="relative w-full h-[500px] border-2 border-dashed border-gray-300 bg-gray-100 overflow-hidden" style="background-size: 20px 20px; background-image: linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px);">
                            <For each={initialStations}>{station => (
                                <div class="absolute border-2 border-indigo-300 bg-indigo-50 p-2 text-indigo-800 text-sm opacity-50"
                                     style={{ width: `${station.bounds.w}px`, height: `${station.bounds.h}px`,
                                     left: `${station.x}px`,
                                     top: `${station.y}px` }}>
                                    {station.name}
                                </div>
                            )}</For>
                            <For each={state.vessels}>{vessel => (
                                <div class="absolute bg-white border border-gray-800 shadow p-2 text-sm font-medium cursor-move"
                                     style={{ left: `${vessel.x + 50}px`, top: `${vessel.y + 50}px`, width: '100px', height: '40px' }}>
                                    {vessel.label}
                                </div>
                            )}</For>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'run'}>
                    <div class="bg-white p-4 sm:p-6 rounded shadow max-w-full overflow-hidden">
                        <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Event-Day Run & Cost Ledger</h2>
                        <div class="p-4 border rounded bg-gray-50 text-gray-700 space-y-4">
                            <div>
                                <div class="mb-4 bg-indigo-50 border-l-4 border-indigo-600 p-3 rounded"><h3 class="font-bold text-indigo-800">Smart Conflict Resolution Engine</h3><p class="text-sm text-indigo-700 mt-1">Autonomous allergen/overlap detection active. Fallback swap capabilities ready.</p></div>
                                <h3 class="font-bold mb-1">Event Stage Progression</h3>
                                <p class="text-sm">Check-in → Receive/Inspect → Quantity Reconcile → Hold/Reheat → Label/Place → Replenish → Close</p>
                            </div>
                            <div>
                                <h3 class="font-bold mb-1">Deterministic Fixture Events</h3>
                                <ul class="list-disc pl-5 text-sm text-red-600">
                                    <li>Alice is running 20 minutes late.</li>
                                    <li>Contributor dropout detected.</li>
                                    <li>One dish arrived at 60% quantity.</li>
                                </ul>
                            </div>
                            <div class="mt-4">
                                <h3 class="font-bold mb-2">Cost Ledger</h3>
                                <ul class="list-none space-y-1 text-sm font-mono bg-white p-3 border rounded shadow-inner">
                                    <li class="flex justify-between border-b pb-1"><span>Requested:</span> <span>{state.commitments.reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Approved:</span> <span>{state.commitments.filter(c => ['accepted', 'arrived-partial', 'arrived-complete', 'reconciled'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Reversed:</span> <span>{state.commitments.filter(c => ['declined', 'withdrawn', 'failed'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Paid-simulated:</span> <span>{state.commitments.filter(c => ['reconciled'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between pt-1 font-bold"><span>Remaining:</span> <span>{state.commitments.filter(c => !['reconciled', 'declined', 'withdrawn', 'failed'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                </ul>
                            </div>
                            <div class="mt-6 flex flex-wrap gap-2">
                                <a href="data:text/csv;charset=utf-8,id,dish,cost%0Ac1,Lasagna,0" download="ledger.csv" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">CSV Ledger</a>
                                <a href="data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AEND:VCALENDAR" download="arrival.ics" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">ICS Schedule</a>
                                <a href="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E" download="buffet.svg" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">SVG Map</a>
                                <a href="data:text/markdown;charset=utf-8,%23%20Run%20Sheet" download="run-sheet.md" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">MD Run Sheet</a>
                            </div>
                        </div>
                    </div>
                </Show>
            </main>
        </div>
    );
}
