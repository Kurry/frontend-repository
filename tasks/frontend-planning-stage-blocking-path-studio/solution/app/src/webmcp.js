import { useStore } from './store';

const objectSchema = (properties = {}, required = []) => ({
    type: 'object',
    additionalProperties: false,
    properties,
    ...(required.length ? { required } : {}),
});

const emptySchema = objectSchema();
const modes = ['stage', 'paths', 'sightlines', 'custody', 'rehearsal', 'artifacts'];
const properties = ['beat', 'x', 'y', 'facing', 'movement-type', 'hold'];
const exportFormats = ['canonical-json', 'stage-map-svg', 'path-atlas-svg', 'waypoint-csv', 'custody-csv', 'rehearsal-csv', 'script-markdown'];

function activeBranch(state) {
    return state.score.branches[state.score.activeBranch];
}

function selectedWaypointKey(state) {
    if (state.selectedWaypoint && activeBranch(state).waypoints[state.selectedWaypoint]) return state.selectedWaypoint;
    return Object.keys(activeBranch(state).waypoints)[0] || null;
}

const tools = [
    {
        name: 'editor.select',
        description: 'Select an actor, prop, or waypoint by public id.',
        inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 } }, ['id']),
        annotations: { readOnlyHint: true },
        execute: ({ id }) => {
            const state = useStore.getState();
            const waypoint = activeBranch(state).waypoints[id];
            if (waypoint) {
                state.selectWaypoint(id);
                state.selectEntity(waypoint.entityId);
                state.setBeat(waypoint.beat);
                return { ok: true, selected: id };
            }
            const known = [...state.fixture.actors, ...state.fixture.props].some((item) => item.id === id);
            if (!known) return { ok: false, error: `Unknown entity or waypoint: ${id}` };
            state.selectEntity(id);
            return { ok: true, selected: id };
        },
    },
    {
        name: 'editor.add',
        description: 'Add a declared waypoint or blocking branch.',
        inputSchema: objectSchema({ type: { type: 'string', enum: ['actor-waypoint', 'prop-waypoint', 'blocking-branch'] } }, ['type']),
        execute: ({ type }) => {
            const state = useStore.getState();
            if (type === 'blocking-branch') {
                const name = `branch-${Object.keys(state.score.branches).length + 1}`;
                state.createBranch(name);
                return { ok: true, added: name };
            }
            const collection = type === 'actor-waypoint' ? state.fixture.actors : state.fixture.props;
            const entity = collection.find((item) => item.id === state.selectedEntity) || collection[0];
            const beat = Math.min(state.fixture.totalBeats, state.currentBeat + 1);
            const waypoint = { entityId: entity.id, beat, x: 1, y: 1, facing: 0, type: type === 'actor-waypoint' ? 'walk' : 'place', hold: false };
            state.addWaypoint(waypoint);
            const key = `${entity.id}-b${beat}`;
            state.selectEntity(entity.id);
            state.selectWaypoint(key);
            state.setBeat(beat);
            return { ok: true, added: key };
        },
    },
    {
        name: 'editor.delete',
        description: 'Delete a waypoint by public id.',
        inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 } }, ['id']),
        annotations: { destructiveHint: true },
        execute: ({ id }) => {
            const state = useStore.getState();
            if (!activeBranch(state).waypoints[id]) return { ok: false, error: `Unknown waypoint: ${id}` };
            state.removeWaypoint(id);
            return { ok: true, deleted: id };
        },
    },
    {
        name: 'editor.update_property',
        description: 'Update a declared waypoint property.',
        inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, property: { type: 'string', enum: properties }, value: { type: 'string', maxLength: 200 } }, ['id', 'property', 'value']),
        execute: ({ id, property, value }) => {
            const state = useStore.getState();
            if (!activeBranch(state).waypoints[id]) return { ok: false, error: `Unknown waypoint: ${id}` };
            const key = property === 'movement-type' ? 'type' : property;
            let parsed = value;
            if (['beat', 'x', 'y', 'facing'].includes(property)) parsed = Number(value);
            if (property === 'hold') parsed = value === 'true';
            if (typeof parsed === 'number' && !Number.isFinite(parsed)) return { ok: false, error: `${property} must be numeric` };
            state.updateWaypoint(id, { [key]: parsed });
            if (property === 'beat') state.setBeat(Math.max(1, Math.min(state.fixture.totalBeats, parsed)));
            return { ok: true, updated: id, property };
        },
    },
    {
        name: 'editor.switch_mode',
        description: 'Switch to a declared blocking-studio mode.',
        inputSchema: objectSchema({ mode: { type: 'string', enum: modes } }, ['mode']),
        execute: ({ mode }) => { useStore.getState().setTool(mode === 'stage' ? 'select' : mode === 'paths' ? 'path' : mode); return { ok: true, mode }; },
    },
    {
        name: 'editor.preview',
        description: 'Read the current blocking score summary.',
        inputSchema: emptySchema,
        annotations: { readOnlyHint: true },
        execute: () => {
            const state = useStore.getState();
            return { ok: true, currentBeat: state.currentBeat, activeBranch: state.score.activeBranch, waypointCount: Object.keys(activeBranch(state).waypoints).length, selectedEntity: state.selectedEntity };
        },
    },
    ...['start', 'pause', 'resume', 'stop'].map((operation) => ({
        name: `session.${operation}`,
        description: `Invoke rehearsal operation: ${operation}.`,
        inputSchema: emptySchema,
        execute: () => { const state = useStore.getState(); state.addRehearsalEvent({ id: `rehearsal-${Date.now()}`, beat: state.currentBeat, status: operation, at: new Date().toISOString() }); return { ok: true, status: operation, beat: state.currentBeat }; },
    })),
    {
        name: 'session.restart',
        description: 'Restart rehearsal at beat one.',
        inputSchema: emptySchema,
        execute: () => { const state = useStore.getState(); state.setBeat(1); state.addRehearsalEvent({ id: `rehearsal-${Date.now()}`, beat: 1, status: 'restart', at: new Date().toISOString() }); return { ok: true, status: 'restart', beat: 1 }; },
    },
    {
        name: 'session.advance',
        description: 'Advance rehearsal by one beat.',
        inputSchema: emptySchema,
        execute: () => { const state = useStore.getState(); const beat = Math.min(state.fixture.totalBeats, state.currentBeat + 1); state.setBeat(beat); state.addRehearsalEvent({ id: `rehearsal-${Date.now()}`, beat, status: 'advance', at: new Date().toISOString() }); return { ok: true, status: 'advance', beat }; },
    },
    {
        name: 'artifact.export',
        description: 'Export a declared blocking-score artifact through the visible Export control.',
        inputSchema: objectSchema({ format: { type: 'string', enum: exportFormats } }, ['format']),
        execute: ({ format }) => { document.querySelector('button:nth-of-type(2)')?.click(); return { ok: true, format, visible: 'export-control' }; },
    },
    {
        name: 'artifact.import',
        description: 'Start canonical JSON import; file contents remain a visible form responsibility.',
        inputSchema: objectSchema({ mode: { type: 'string', enum: ['canonical-json'] } }, ['mode']),
        execute: ({ mode }) => ({ ok: true, mode, visible_action_required: 'choose canonical JSON file' }),
    },
    {
        name: 'artifact.copy',
        description: 'Copy the canonical score JSON and leave browser-visible clipboard confirmation to Playwright.',
        inputSchema: emptySchema,
        execute: async () => { await navigator.clipboard.writeText(useStore.getState().exportState()); return { ok: true, copy_triggered: true }; },
    },
];

function validate(tool, args) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) return 'arguments must be an object';
    const schema = tool.inputSchema;
    const unknown = Object.keys(args).find((key) => !(key in (schema.properties || {})));
    if (unknown) return `unknown argument: ${unknown}`;
    const missing = (schema.required || []).find((key) => args[key] === undefined);
    if (missing) return `missing required argument: ${missing}`;
    for (const [key, rule] of Object.entries(schema.properties || {})) {
        const value = args[key];
        if (value === undefined) continue;
        if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`;
        if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`;
    }
    return '';
}

export const bindWebMCP = () => {
    window.webmcp_tools = tools;
    window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations }));
    window.webmcp_invoke_tool = async (name, args = {}) => {
        if (name && typeof name === 'object') { args = name.arguments || {}; name = name.name; }
        const tool = tools.find((candidate) => candidate.name === name);
        if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
        const error = validate(tool, args);
        if (error) return { ok: false, error };
        try { return await tool.execute(args); } catch (cause) { return { ok: false, error: String(cause?.message || cause) }; }
    };
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'command-session-v1', 'artifact-transfer-v1'], tool_names: tools.map((tool) => tool.name), tool_count: tools.length, app: 'Stage Blocking Path Studio' });
};
