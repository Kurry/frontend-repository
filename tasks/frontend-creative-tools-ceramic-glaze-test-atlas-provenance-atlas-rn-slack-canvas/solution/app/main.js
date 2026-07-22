const seedRecords = [
    {
        id: "rec_1",
        name: "Cobalt Blue Base",
        ingredients: "Silica 30, Cobalt 2",
        firingTemperature: 1220,
        status: "ready",
        sourceEvidence: "Batch #42 passed scratch test."
    },
    {
        id: "rec_2",
        name: "Crazing Iron",
        ingredients: "Iron Oxide 10, Flux 15",
        firingTemperature: 1200,
        status: "changed",
        sourceEvidence: "Micro fractures seen on cooling."
    },
    {
        id: "rec_3",
        name: "Stable White",
        ingredients: "Zircopax 12",
        firingTemperature: 1220,
        status: "draft",
        sourceEvidence: "First run."
    }
];

let state = {
    records: [...seedRecords],
    history: [],
    filter: "all",
    selectedId: null,
    undoStack: []
};

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function pushHistory(action, recordId) {
    state.history.push({ action, recordId, timestamp: new Date().toISOString() });
}

function saveUndoState() {
    state.undoStack.push(deepClone(state));
}

function render() {
    const app = document.getElementById('app');

    const visibleRecords = state.records.filter(r => state.filter === "all" || r.status === state.filter);

    let summaryHtml = `
        <div class="p-4 bg-gray-100 border-b flex justify-between items-center">
            <h1 class="text-xl font-bold">Provenance Atlas</h1>
            <div>
                <select id="filter-select" class="border p-1 rounded">
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>All</option>
                    <option value="draft" ${state.filter === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="ready" ${state.filter === 'ready' ? 'selected' : ''}>Ready</option>
                    <option value="changed" ${state.filter === 'changed' ? 'selected' : ''}>Changed</option>
                    <option value="quarantined" ${state.filter === 'quarantined' ? 'selected' : ''}>Quarantined</option>
                    <option value="archived" ${state.filter === 'archived' ? 'selected' : ''}>Archived</option>
                </select>
                <button id="export-btn" class="ml-2 bg-blue-500 text-white px-3 py-1 rounded">Export</button>
                <input type="file" id="import-file" class="hidden" accept=".json">
                <button id="import-btn" class="ml-2 bg-green-500 text-white px-3 py-1 rounded">Import</button>
                <button id="undo-btn" class="ml-2 bg-gray-300 px-3 py-1 rounded" ${state.undoStack.length === 0 ? 'disabled' : ''}>Undo</button>
            </div>
        </div>
        <div class="p-2 bg-yellow-50 text-sm">
            Summary: ${state.records.filter(r=>r.status==='ready').length} ready, ${state.records.filter(r=>r.status==='quarantined').length} quarantined. Total: ${state.records.length}
        </div>
    `;

    let listHtml = `
        <div class="flex-1 overflow-y-auto p-4 border-r">
            <div class="flex justify-between mb-4">
                <h2 class="font-bold">Glaze Tests</h2>
                <button id="create-btn" class="text-blue-500 font-semibold">+ New</button>
            </div>
            <ul id="record-list" class="space-y-2" aria-live="polite">
                ${visibleRecords.map(r => `
                    <li class="p-3 border rounded cursor-pointer hover:bg-gray-50 animate-morph ${state.selectedId === r.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : ''}" data-id="${r.id}">
                        <div class="flex justify-between">
                            <span class="font-semibold">${r.name}</span>
                            <span class="text-xs px-2 py-1 rounded bg-gray-200">${r.status}</span>
                        </div>
                    </li>
                `).join('')}
                ${visibleRecords.length === 0 ? '<li class="text-gray-500 italic">No records match the filter.</li>' : ''}
            </ul>
        </div>
    `;

    let selectedRecord = state.records.find(r => r.id === state.selectedId);
    let detailHtml = `
        <div class="w-full sm:w-1/3 bg-white p-6 overflow-y-auto border-t sm:border-t-0">
            ${selectedRecord ? `
                <h2 class="text-xl font-bold mb-4">Detail View</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="edit-name" class="w-full border rounded p-2" value="${selectedRecord.name}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Ingredients</label>
                        <input type="text" id="edit-ingredients" class="w-full border rounded p-2" value="${selectedRecord.ingredients}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Firing Temp (°C)</label>
                        <input type="number" id="edit-temp" class="w-full border rounded p-2" value="${selectedRecord.firingTemperature}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <select id="edit-status" class="w-full border rounded p-2">
                            ${['draft', 'ready', 'changed', 'archived', 'quarantined'].map(s => `
                                <option value="${s}" ${selectedRecord.status === s ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Source Evidence</label>
                        <textarea id="edit-evidence" class="w-full border rounded p-2 h-24">${selectedRecord.sourceEvidence}</textarea>
                    </div>
                    <div id="error-msg" class="text-red-500 text-sm hidden" aria-live="polite"></div>
                    <div class="flex space-x-2">
                        <button id="save-btn" class="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                        <button id="quarantine-btn" class="bg-red-600 text-white px-4 py-2 rounded">Trace & Quarantine</button>
                    </div>
                </div>
            ` : `
                <div class="flex items-center justify-center h-full text-gray-400">
                    Select a record to view details or quarantine.
                </div>
            `}
        </div>
    `;

    app.innerHTML = `
        <div class="flex flex-col h-full w-full">
            ${summaryHtml}
            <div class="flex flex-1 overflow-hidden flex-col sm:flex-row">
                ${listHtml}
                ${detailHtml}
            </div>
        </div>
    `;

    attachEvents();
    updateWebMCPState();
}

function attachEvents() {
    document.getElementById('filter-select').addEventListener('change', (e) => {
        state.filter = e.target.value;
        render();
    });

    document.getElementById('record-list').addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (li) {
            state.selectedId = li.dataset.id;
            render();
        }
    });

    document.getElementById('create-btn').addEventListener('click', () => {
        saveUndoState();
        const id = 'rec_' + Date.now();
        state.records.push({
            id,
            name: "New Test",
            ingredients: "",
            firingTemperature: 1200,
            status: "draft",
            sourceEvidence: ""
        });
        pushHistory('CREATE', id);
        state.selectedId = id;
        render();
    });

    document.getElementById('undo-btn').addEventListener('click', () => {
        if (state.undoStack.length > 0) {
            state = state.undoStack.pop();
            render();
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (state.undoStack.length > 0) {
                state = state.undoStack.pop();
                render();
            }
        }
    });

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('edit-name').value.trim();
            const temp = parseInt(document.getElementById('edit-temp').value, 10);
            const err = document.getElementById('error-msg');

            if (!name) {
                err.textContent = "Name is required.";
                err.classList.remove('hidden');
                return;
            }
            if (isNaN(temp) || temp < 0 || temp > 2000) {
                err.textContent = "Firing temperature must be between 0 and 2000.";
                err.classList.remove('hidden');
                return;
            }

            saveUndoState();
            const rec = state.records.find(r => r.id === state.selectedId);
            if (rec) {
                rec.name = name;
                rec.ingredients = document.getElementById('edit-ingredients').value;
                rec.firingTemperature = temp;
                rec.status = document.getElementById('edit-status').value;
                rec.sourceEvidence = document.getElementById('edit-evidence').value;
                pushHistory('UPDATE', rec.id);
            }
            render();
        });
    }

    const quarBtn = document.getElementById('quarantine-btn');
    if (quarBtn) {
        quarBtn.addEventListener('click', () => {
            saveUndoState();
            const rec = state.records.find(r => r.id === state.selectedId);
            if (rec) {
                rec.status = 'quarantined';
                rec.sourceEvidence += "\n[QUARANTINED] Bad lineage traced.";
                pushHistory('QUARANTINE', rec.id);
            }
            render();
        });
    }

    document.getElementById('export-btn').addEventListener('click', () => {
        const artifact = {
            schemaVersion: "v1",
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: {
                summary: `${state.records.filter(r=>r.status==='ready').length} ready, ${state.records.filter(r=>r.status==='quarantined').length} quarantined`
            },
            history: state.history
        };
        const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'glaze-atlas-v1.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                window.importState(data);
            } catch (err) {
                alert("Invalid JSON");
            }
        };
        reader.readAsText(file);
    });
}

function updateWebMCPState() {
    window.appState = {
        schemaVersion: "v1",
        exportedAt: new Date().toISOString(),
        records: deepClone(state.records),
        derived: {
            summary: `${state.records.filter(r=>r.status==='ready').length} ready, ${state.records.filter(r=>r.status==='quarantined').length} quarantined`
        },
        history: deepClone(state.history)
    };
}

window.importState = function(artifact) {
    if (!artifact || artifact.schemaVersion !== "v1" || !Array.isArray(artifact.records)) {
        return; // invalid schema, no-op
    }

    // Check for duplicates
    const ids = new Set();
    for (const r of artifact.records) {
        if (ids.has(r.id)) return; // duplicate ID, no-op
        ids.add(r.id);
        if (typeof r.firingTemperature !== 'number' || r.firingTemperature < 0 || r.firingTemperature > 2000) return;
        if (!['draft', 'ready', 'changed', 'archived', 'quarantined'].includes(r.status)) return;
    }

    saveUndoState();
    state.records = artifact.records;
    state.history = artifact.history || [];
    state.selectedId = null;
    state.filter = "all";
    render();
};

window.webmcp_session_info = {
    "task_id": "frontend-creative-tools-ceramic-glaze-test-atlas-provenance-atlas-rn-slack-canvas",
    "capabilities": ["ui_query", "ui_mutation"]
};

window.webmcp_list_tools = function() {
    return [
        {
            "name": "query_state",
            "description": "Query the current application state.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "import_artifact",
            "description": "Import a glaze atlas artifact.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "artifact": {
                        "type": "object",
                        "description": "The glaze-atlas-v1.json artifact to import."
                    }
                },
                "required": ["artifact"]
            }
        },
        {
            "name": "create_record",
            "description": "Create a new glaze test record.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "update_record",
            "description": "Update the currently selected glaze test record.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "name": { "type": "string" },
                    "ingredients": { "type": "string" },
                    "firingTemperature": { "type": "number" },
                    "status": { "type": "string", "enum": ["draft", "ready", "changed", "archived", "quarantined"] },
                    "sourceEvidence": { "type": "string" }
                },
                "required": ["name", "firingTemperature"]
            }
        },
        {
            "name": "trace_and_quarantine",
            "description": "Trace a selected record to source evidence and quarantine a bad lineage.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "undo",
            "description": "Undo the last mutation.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }
    ];
};

window.webmcp_invoke_tool = function(name, args) {
    if (name === "query_state") {
        if (window.appState) {
            return { "result": window.appState };
        }
        return { "error": "State not available" };
    } else if (name === "import_artifact") {
        if (window.importState) {
            window.importState(args.artifact);
            return { "result": "success" };
        }
        return { "error": "importState not implemented" };
    } else if (name === "create_record") {
        if (window.createRecord) {
            window.createRecord();
            return { "result": "success" };
        }
        return { "error": "createRecord not implemented" };
    } else if (name === "update_record") {
        if (window.updateRecord) {
            const res = window.updateRecord(args);
            if (res.error) return { "error": res.error };
            return { "result": "success" };
        }
        return { "error": "updateRecord not implemented" };
    } else if (name === "trace_and_quarantine") {
        if (window.traceAndQuarantine) {
            window.traceAndQuarantine();
            return { "result": "success" };
        }
        return { "error": "traceAndQuarantine not implemented" };
    } else if (name === "undo") {
        if (window.undoLastAction) {
            window.undoLastAction();
            return { "result": "success" };
        }
        return { "error": "undoLastAction not implemented" };
    }
    return { "error": "Unknown tool: " + name };
};

// Implement missing globals
window.createRecord = function() {
    saveUndoState();
    const id = 'rec_' + Date.now();
    state.records.push({
        id,
        name: "New Test",
        ingredients: "",
        firingTemperature: 1200,
        status: "draft",
        sourceEvidence: ""
    });
    pushHistory('CREATE', id);
    state.selectedId = id;
    render();
};

window.updateRecord = function(args) {
    if (!state.selectedId) return { error: "No record selected" };
    const rec = state.records.find(r => r.id === state.selectedId);
    if (!rec) return { error: "Record not found" };

    saveUndoState();
    if (args.name !== undefined) rec.name = args.name;
    if (args.ingredients !== undefined) rec.ingredients = args.ingredients;
    if (args.firingTemperature !== undefined) rec.firingTemperature = args.firingTemperature;
    if (args.status !== undefined) rec.status = args.status;
    if (args.sourceEvidence !== undefined) rec.sourceEvidence = args.sourceEvidence;
    pushHistory('UPDATE', rec.id);
    render();
    return { success: true };
};

window.traceAndQuarantine = function() {
    if (!state.selectedId) return;
    const rec = state.records.find(r => r.id === state.selectedId);
    if (rec) {
        saveUndoState();
        rec.status = 'quarantined';
        rec.sourceEvidence += "\n[QUARANTINED] Bad lineage traced.";
        pushHistory('QUARANTINE', rec.id);
        render();
    }
};

window.undoLastAction = function() {
    if (state.undoStack.length > 0) {
        state = state.undoStack.pop();
        render();
    }
};

// Init
render();
