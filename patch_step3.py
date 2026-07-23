import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. State syncing in handleCommit
old_commit = """    const handleCommit = () => {
        const id = 'c' + Date.now();
        setState('commitments', c => [...c, { id, dish: 'New Dish', portions: 10, owner: 'You', state: 'accepted', targetId: 't4', dietary: ['None'] }]);
    };"""

new_commit = """    const handleCommit = () => {
        const id = 'c' + Date.now();
        setState('commitments', c => [...c, { id, dish: 'New Dish', portions: 10, owner: 'You', state: 'accepted', targetId: 't4', dietary: ['None'] }]);
        setState('vessels', v => [...v, { id: 'v' + Date.now(), dishId: id, x: 150, y: 100, rotation: 0, stationId: 's1', label: 'New Dish' }]);
    };"""

content = content.replace(old_commit, new_commit)


# 2. Add selectedCell state and click handler
content = content.replace(
    "const [activeTab, setActiveTab] = createSignal('coverage');",
    "const [activeTab, setActiveTab] = createSignal('coverage');\n    const [selectedCell, setSelectedCell] = createSignal(null);"
)

# Replace the table cell logic in the matrix
old_td = """                                                return <td class={`p-2 ${provided < target.required / 6 ? 'text-red-500' : 'text-green-600'}`}>{provided}</td>;"""
new_td = """                                                const isSelected = selectedCell()?.targetId === target.id && selectedCell()?.group === group;
                                                const bgClass = isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : '';
                                                const textClass = provided < target.required / 6 ? 'text-red-500 font-bold' : (provided > target.required * 1.5 ? 'text-orange-600 font-bold' : 'text-green-600');
                                                const unknownClass = provided === 0 ? 'italic text-gray-400' : '';
                                                return <td
                                                    class={`p-2 cursor-pointer ${bgClass} ${textClass} ${unknownClass}`}
                                                    onClick={() => setSelectedCell({ targetId: target.id, group })}
                                                >
                                                    {provided === 0 ? '?' : provided}
                                                </td>;"""

content = content.replace(old_td, new_td)

# 3. Update commitment cards to show required info + highlighting
old_card = """                            <For each={state.commitments}>{commit => (
                                <div class="border p-4 rounded shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none">
                                    <h3 class="font-bold text-lg">{commit.dish}</h3>
                                    <p class="text-sm text-gray-600">Owner: {commit.owner}</p>
                                    <p class="text-sm text-gray-600">Portions: {commit.portions}</p>
                                    <p class="text-sm text-gray-600">Target: {initialTargets.find(t => t.id === commit.targetId)?.name}</p>
                                    <span class={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${commit.state === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{commit.state}</span>
                                </div>
                            )}</For>"""

new_card = """                            <For each={state.commitments}>{commit => {
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
                            )}}</For>"""

content = content.replace(old_card, new_card)

with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
