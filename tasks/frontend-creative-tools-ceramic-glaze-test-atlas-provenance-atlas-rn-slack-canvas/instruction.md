# Ceramic Glaze Test Atlas — Provenance Atlas — Slack Canvas

<summary>
Manage glaze tests through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence. Built with vanilla HTML, CSS, JavaScript, and Tailwind CSS 4.3.2.

Existing tools split glaze tests editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Slack's shipped pattern of embedded workflows, real-time data, approval before AI edits, templates, and analytics into a self-contained frontend job.
</summary>

<core_features>
- Create, edit, archive, and filter glaze tests with explicit domain statuses (e.g., draft, ready, changed, archived, quarantined).
- Filter or reorder records by domain state.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state effect: Mutates records[] and status fields in glaze-atlas-v1.json.
- Trace a selected record to source evidence and quarantine a bad lineage.
- Undo the last mutation and inspect the linked representation.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state effect: Updates provenance-atlas geometry/selection, derived summaries, and event history.
- Export the current artifact.
- Clear and import it with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- Shared-state effect: Produces glaze-atlas-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas (Slack Canvas inspired). Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Browser-observable behaviors only.
- In-memory state only (NO localStorage, no backend).
- Alternate input parity: Keyboard and touch-equivalent controls produce identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The provenance atlas surface, derived summary, and artifact query share one state.
- Performance: Keep edits responsive on 100 records and avoid rebuilding unrelated surfaces.
- Dependencies: Tailwind CSS 4.3.2. All dependencies must be installed via npm (no cdn).
- Serve via npm start on port 3000.
- zero console/page errors.
</requirements>

<webmcp_action_contract>
# WebMCP Action Contract

```javascript
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
```
</webmcp_action_contract>