import { store } from './store.js';

export const initializeWebMCP = () => {
    window.webmcp_session_info = () => ({ "client_name": "Drum Pattern Practice Board", "contract_version": "zto-webmcp-v1", "supported_modules": ["entity-collection-v1", "artifact-transfer-v1"] });
    window.webmcp_list_tools = () => ([
        { "name": "entity_create_drum_pattern", "parameters": { "type": "object", "properties": { "name": { "type": "string" }, "tempo": { "type": "number" }, "status": { "type": "string" } }, "required": ["name", "tempo", "status"] } },
        { "name": "entity_update_drum_pattern", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "name": { "type": "string" }, "tempo": { "type": "number" }, "status": { "type": "string" }, "evidence": { "type": "string" } }, "required": ["id"] } },
        { "name": "entity_select_drum_pattern", "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } },
        { "name": "entity_delete_drum_pattern", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "confirm": { "type": "boolean" } }, "required": ["id", "confirm"] } },
        { "name": "artifact_export_drum_pattern_v1_audit_lens_json", "parameters": { "type": "object", "properties": {} } },
        { "name": "artifact_import_drum_pattern_v1_audit_lens_json", "parameters": { "type": "object", "properties": { "artifact_content": { "type": "string" } } } }
    ]);

    window.webmcp_invoke_tool = async (tool_name, parameters) => {
        const state = store.get();
        switch (tool_name) {
            case 'entity_create_drum_pattern': {
                let newId; store.set(s => { newId = Math.random().toString(36).substring(2, 9); s.records.push({ id: newId, name: parameters.name, tempo: parameters.tempo, status: parameters.status, evidence: null }); });
                return { success: true, result: { id: newId } };
            }
            case 'entity_update_drum_pattern': {
                let success = false; store.set(s => { const record = s.records.find(r => r.id === parameters.id); if (record) { if (parameters.name) record.name = parameters.name; if (parameters.tempo) record.tempo = parameters.tempo; if (parameters.status) record.status = parameters.status; if (parameters.evidence !== undefined) record.evidence = parameters.evidence; success = true; } });
                return { success, result: success ? "Updated" : "Not found" };
            }
            case 'entity_select_drum_pattern': {
                store.set(s => { s.auditLensState.selectedId = parameters.id; const r = s.records.find(r => r.id === parameters.id); if (r && r.status === 'changed') s.auditLensState.mode = 'conflict'; else if (r) s.auditLensState.mode = 'selected'; else s.auditLensState.mode = 'idle'; });
                return { success: true, result: "Selected" };
            }
            case 'entity_delete_drum_pattern': {
                if (!parameters.confirm) return { success: false, error: "confirm=true is required" };
                let success = false; store.set(s => { const initialLength = s.records.length; s.records = s.records.filter(r => r.id !== parameters.id); if (s.records.length < initialLength) { success = true; if (s.auditLensState.selectedId === parameters.id) { s.auditLensState.selectedId = null; s.auditLensState.mode = 'idle'; } } });
                return { success, result: success ? "Deleted" : "Not found" };
            }
            case 'artifact_export_drum_pattern_v1_audit_lens_json': {
                return { success: true, result: { schemaVersion: 'v1', exportedAt: new Date().toISOString(), records: state.records, derived: state.derived, history: state.history } };
            }
            default: return { success: false, error: "Unknown tool" };
        }
    };
};
