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
    { id: 's1', name: 'Hot Station', bounds: { w: 200, h: 60 } },
    { id: 's2', name: 'Cold Station', bounds: { w: 200, h: 60 } },
    { id: 's3', name: 'Dessert Station', bounds: { w: 100, h: 60 } },
    { id: 's4', name: 'Drink Station', bounds: { w: 100, h: 60 } }
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
    };

    const handleExportJSON = () => {
        const exportData = {
            schemaVersion: "potluck-event-plan/v1",
            commitments: state.commitments,
            vessels: state.vessels,
            resources: state.resources
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'potluck-plan.json';
        a.click();
    };

    return (
        <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header class="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
                <h1 class="text-xl font-bold">Potluck Contribution Orchestrator</h1>
                <div class="space-x-4">
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded" onClick={() => setActiveTab('coverage')}>Coverage Matrix</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded" onClick={() => setActiveTab('commitments')}>Commitments</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded" onClick={() => setActiveTab('buffet')}>Buffet Layout</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded" onClick={() => setActiveTab('run')}>Run Day</button>
                    <button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded border border-white" onClick={handleExportJSON}>Export JSON</button>
                </div>
            </header>

            <main class="flex-1 p-6 overflow-auto">
                <Show when={activeTab() === 'coverage'}>
                    <div class="bg-white p-6 rounded shadow">
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
                                                return <td class={`p-2 ${provided < target.required / 6 ? 'text-red-500' : 'text-green-600'}`}>{provided}</td>;
                                            }}</For>
                                        </tr>
                                    )}</For>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'commitments'}>
                    <div class="bg-white p-6 rounded shadow">
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 class="text-2xl font-semibold">Commitments</h2>
                            <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={handleCommit}>Add Commitment</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <For each={state.commitments}>{commit => (
                                <div class="border p-4 rounded shadow-sm hover:shadow-md transition">
                                    <h3 class="font-bold text-lg">{commit.dish}</h3>
                                    <p class="text-sm text-gray-600">Owner: {commit.owner}</p>
                                    <p class="text-sm text-gray-600">Portions: {commit.portions}</p>
                                    <p class="text-sm text-gray-600">Target: {initialTargets.find(t => t.id === commit.targetId)?.name}</p>
                                    <span class={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${commit.state === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{commit.state}</span>
                                </div>
                            )}</For>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'buffet'}>
                    <div class="bg-white p-6 rounded shadow">
                        <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Buffet Layout Canvas</h2>
                        <div class="relative w-full h-[500px] border-2 border-dashed border-gray-300 bg-gray-100 overflow-hidden">
                            <For each={initialStations}>{station => (
                                <div class="absolute border-2 border-indigo-300 bg-indigo-50 p-2 text-indigo-800 text-sm opacity-50"
                                     style={{ width: `${station.bounds.w}px`, height: `${station.bounds.h}px`,
                                     left: `${station.id === 's1' ? 50 : station.id === 's2' ? 300 : 50}px`,
                                     top: `${station.id === 's1' ? 50 : station.id === 's2' ? 50 : 200}px` }}>
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
                    <div class="bg-white p-6 rounded shadow">
                        <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Event-Day Run & Cost Ledger</h2>
                        <div class="p-4 border rounded bg-gray-50 text-gray-700">
                            <p>Event run advances: Check-in → Receive → Reconcile → Reheat → Place → Replenish</p>
                            <p class="mt-2 text-sm text-red-600">Fixture Event: Alice is running 20 minutes late.</p>
                            <div class="mt-4">
                                <h3 class="font-bold">Cost Ledger</h3>
                                <ul class="list-disc pl-5 mt-2">
                                    <li>Requested: $0.00</li>
                                    <li>Approved: $0.00</li>
                                    <li>Reversed: $0.00</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Show>
            </main>
        </div>
    );
}
