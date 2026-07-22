import { useEffect } from 'react';
import { WorkTasks } from './components/WorkTasks';
import { ForecastRibbon } from './components/ForecastRibbon';
import { ArtifactTools } from './components/ArtifactTools';
import { useStore, calculateDerivedStats } from './store';
import { formatISO } from 'date-fns';
import type { RecordStatus } from './types';

function App() {

    useEffect(() => {
        // Implement WebMCP Contracts
        const store = useStore.getState;

        (window as any).webmcp_session_info = async () => ({
            task_id: "eval-intelligence/frontend-planning-community-garden-workday-planner-forecast-ribbon-rn-github-issue-fields",
            modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
            status: "ready"
        });

        (window as any).webmcp_list_tools = async () => {
            return [
                {
                    name: "editor_select",
                    description: "Select an object in the structured editor",
                    inputSchema: { type: "object", properties: { target_id: { type: "string" } }, required: ["target_id"] }
                },
                {
                    name: "editor_update_property",
                    description: "Update a property of the selected object",
                    inputSchema: { type: "object", properties: { property: { type: "string" }, value: { type: "string" } }, required: ["property", "value"] }
                },
                {
                    name: "editor_preview",
                    description: "Apply the forecast",
                    inputSchema: { type: "object", properties: {} }
                },
                {
                    name: "entity_create",
                    description: "Create a new record",
                    inputSchema: { type: "object", properties: { title: { type: "string" }, status: { type: "string" }, assignedDate: { type: "string" }, effort: { type: "number" } }, required: ["title", "status", "assignedDate", "effort"] }
                },
                {
                    name: "entity_update",
                    description: "Update a record",
                    inputSchema: { type: "object", properties: { target_id: { type: "string" }, updates: { type: "object" } }, required: ["target_id", "updates"] }
                },
                {
                    name: "entity_delete",
                    description: "Delete a record",
                    inputSchema: { type: "object", properties: { target_id: { type: "string" }, confirm: { type: "boolean" } }, required: ["target_id", "confirm"] }
                },
                {
                    name: "entity_select",
                    description: "Select a record for mutation",
                    inputSchema: { type: "object", properties: { target_id: { type: "string" } }, required: ["target_id"] }
                },
                {
                    name: "entity_filter",
                    description: "Filter records by status",
                    inputSchema: { type: "object", properties: { filter: { type: "string" } }, required: ["filter"] }
                },
                {
                    name: "artifact_export",
                    description: "Export the artifact",
                    inputSchema: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
                },
                {
                    name: "artifact_import",
                    description: "Import the artifact",
                    inputSchema: { type: "object", properties: { format: { type: "string" }, data: { type: "object" } }, required: ["format", "data"] }
                }
            ];
        };

        (window as any).webmcp_invoke_tool = async (tool_name: string, args: any) => {
            const state = store();

            if (tool_name === "editor_select") {
                state.selectRecord(args.target_id);
                return { success: true };
            }
            if (tool_name === "editor_update_property") {
                if (args.property === 'status') {
                    state.updateForecast({ status: args.value as RecordStatus });
                }
                if (args.property === 'effort') {
                    state.updateForecast({ effort: Number(args.value) });
                }
                return { success: true };
            }
            if (tool_name === "editor_preview") {
                state.applyForecast();
                return { success: true };
            }
            if (tool_name === "entity_create") {
                state.addRecord({ title: args.title, status: args.status as RecordStatus, assignedDate: args.assignedDate, effort: Number(args.effort) });
                return { success: true };
            }
            if (tool_name === "entity_update") {
                state.updateRecord(args.target_id, args.updates);
                return { success: true };
            }
            if (tool_name === "entity_delete") {
                if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
                state.deleteRecord(args.target_id);
                return { success: true };
            }
            if (tool_name === "entity_select") {
                state.selectRecord(args.target_id);
                return { success: true };
            }
            if (tool_name === "entity_filter") {
                state.setFilter(args.filter as RecordStatus | 'all');
                return { success: true };
            }
            if (tool_name === "artifact_export") {
                if (args.format !== 'session-json') throw new Error("Unsupported format");
                const derived = calculateDerivedStats(state.records, state.selectedRecordId, state.forecastRecord);
                const session = {
                    schemaVersion: 'garden-workday-v1',
                    exportedAt: formatISO(new Date()),
                    records: state.records,
                    derived,
                    history: state.history
                };
                return { success: true, artifact: session };
            }
            if (tool_name === "artifact_import") {
                if (args.format !== 'session-json') throw new Error("Unsupported format");
                state.importArtifact(args.data);
                return { success: true };
            }

            throw new Error(`Unknown tool: ${tool_name}`);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 sm:p-8">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-slate-800">Community Garden Workday Planner</h1>
                    <p className="text-slate-600">Manage work tasks and forecast effort to prevent over-scheduling.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <WorkTasks />
                        <ForecastRibbon />
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <ArtifactTools />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
