import { state, setState } from '../store';
import { For, createMemo } from 'solid-js';

export default function TimelineRail(props) {
    const tasks = createMemo(() => {
        return [...props.opp.tasks].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const addTask = () => {
        const id = `t_${Date.now()}`;
        setState('opportunities', o => o.id === props.opp.id, 'tasks', t => [...t, {
            id,
            type: 'prep',
            date: new Date().toISOString().split('T')[0],
            title: 'New obligation'
        }]);
    };

    return (
        <div class="h-full border-l p-4 flex flex-col bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-gray-800 text-sm uppercase tracking-wider">Obligations</h3>
                <button onClick={addTask} class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">
                    + Add
                </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3">
                <For each={tasks()}>
                    {(task) => (
                        <div class="p-3 border rounded-lg bg-gray-50 shadow-sm relative">
                            <div class="flex justify-between items-start mb-2">
                                <select
                                    class="text-xs font-semibold uppercase bg-transparent border-none p-0 text-gray-600 focus:ring-0 cursor-pointer"
                                    value={task.type}
                                    onChange={(e) => setState('opportunities', o => o.id === props.opp.id, 'tasks', t => t.id === task.id, 'type', e.target.value)}
                                >
                                    <option value="prep">Prep</option>
                                    <option value="interview">Interview</option>
                                    <option value="thank-you">Thank You</option>
                                    <option value="follow-up">Follow Up</option>
                                </select>
                                <button
                                    class="text-gray-400 hover:text-red-500 text-lg leading-none"
                                    onClick={() => setState('opportunities', o => o.id === props.opp.id, 'tasks', t => t.filter(x => x.id !== task.id))}
                                >
                                    ×
                                </button>
                            </div>
                            <input
                                class="w-full text-sm font-medium bg-transparent border-none p-0 mb-1 focus:ring-0"
                                value={task.title}
                                onInput={(e) => setState('opportunities', o => o.id === props.opp.id, 'tasks', t => t.id === task.id, 'title', e.target.value)}
                            />
                            <input
                                type="date"
                                class="w-full text-xs text-gray-500 bg-transparent border-none p-0 focus:ring-0"
                                value={task.date}
                                onChange={(e) => setState('opportunities', o => o.id === props.opp.id, 'tasks', t => t.id === task.id, 'date', e.target.value)}
                            />
                        </div>
                    )}
                </For>
                {tasks().length === 0 && (
                    <div class="text-sm text-gray-400 text-center py-4 italic">No obligations scheduled.</div>
                )}
            </div>
        </div>
    );
}
