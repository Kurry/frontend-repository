import React, { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { WorkdayTaskSchema, CommunityGardenWorkdayPlannerSessionSchema } from './schemas';

export const WebMCPIntegration: React.FC = () => {
    const { state, dispatch, derived } = useAppStore();

    // We need a stable reference to state for the async handlers without closing over stale state
    const stateRef = useRef(state);
    const derivedRef = useRef(derived);

    useEffect(() => {
        stateRef.current = state;
        derivedRef.current = derived;
    }, [state, derived]);

    useEffect(() => {
        // Expose session info
        (window as any).webmcp_session_info = async () => ({
            task_id: "eval-intelligence/frontend-planning-community-garden-workday-planner-spatial-composer-rn-provenance-artifact"
        });

        // Hardcode the tools to match the WebMCP action contract in instruction.md
        const tools = [
            {
                name: "entity_create_record",
                module: "entity-collection-v1",
                description: "Create a workday-task",
                inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["workday-task"] }, record: { type: "object" } }, required: ["entity", "record"] }
            },
            {
                name: "entity_select_record",
                module: "entity-collection-v1",
                description: "Select a workday-task",
                inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["workday-task"] }, id: { type: "string" } }, required: ["entity", "id"] }
            },
            {
                name: "entity_update_record",
                module: "entity-collection-v1",
                description: "Update a workday-task",
                inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["workday-task"] }, id: { type: "string" }, record: { type: "object" } }, required: ["entity", "id", "record"] }
            },
            {
                name: "entity_delete_record",
                module: "entity-collection-v1",
                description: "Delete a workday-task",
                inputSchema: { type: "object", properties: { entity: { type: "string", enum: ["workday-task"] }, id: { type: "string" } }, required: ["entity", "id"] }
            },
            {
                name: "artifact_export_session_json",
                module: "artifact-transfer-v1",
                description: "Export garden-workday-v1-spatial-composer.json",
                inputSchema: { type: "object", properties: { format: { type: "string", enum: ["garden-workday-v1-spatial-composer.json"] } }, required: ["format"] }
            },
            {
                name: "artifact_import_session_json",
                module: "artifact-transfer-v1",
                description: "Import garden-workday-v1-spatial-composer.json",
                inputSchema: { type: "object", properties: { format: { type: "string", enum: ["garden-workday-v1-spatial-composer.json"] }, artifact: { type: "object" } }, required: ["format", "artifact"] }
            }
        ];

        (window as any).webmcp_list_tools = async () => tools;

        (window as any).webmcp_invoke_tool = async (request: any) => {
            const current = stateRef.current;
            const currentDerived = derivedRef.current;
            const name = request.method || request.name;
            const args = request.params?.arguments || request.arguments || {};

            switch (name) {
                case "entity_create_record": {
                    const parsed = WorkdayTaskSchema.safeParse(args.record);
                    if (!parsed.success) throw new Error("Invalid record: " + parsed.error.message);
                    dispatch({ type: 'CREATE_TASK', payload: parsed.data });
                    return { content: [{ type: "text", text: `Created ${parsed.data.id}` }] };
                }
                case "entity_select_record": {
                    const exists = current.records.find(r => r.id === args.id);
                    if (!exists) throw new Error("Record not found");
                    dispatch({ type: 'SELECT_TASK', payload: args.id });
                    return { content: [{ type: "text", text: `Selected ${args.id}` }] };
                }
                case "entity_update_record": {
                    const exists = current.records.find(r => r.id === args.id);
                    if (!exists) throw new Error("Record not found");
                    // merge updates
                    const merged = { ...exists, ...args.record };
                    const parsed = WorkdayTaskSchema.safeParse(merged);
                    if (!parsed.success) throw new Error("Invalid update: " + parsed.error.message);
                    dispatch({ type: 'UPDATE_TASK', payload: parsed.data });
                    return { content: [{ type: "text", text: `Updated ${args.id}` }] };
                }
                case "entity_delete_record": {
                    const exists = current.records.find(r => r.id === args.id);
                    if (!exists) throw new Error("Record not found");
                    dispatch({ type: 'DELETE_TASK', payload: args.id });
                    return { content: [{ type: "text", text: `Deleted ${args.id}` }] };
                }
                case "artifact_export_session_json": {
                    const payload = {
                        schemaVersion: 'v1' as const,
                        exportedAt: new Date().toISOString(),
                        records: current.records,
                        derived: currentDerived,
                        history: current.history
                    };
                    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
                }
                case "artifact_import_session_json": {
                    const parsed = CommunityGardenWorkdayPlannerSessionSchema.safeParse(args.artifact);
                    if (!parsed.success) throw new Error("Invalid artifact: " + parsed.error.message);
                    dispatch({ type: 'IMPORT_STATE', payload: parsed.data });
                    return { content: [{ type: "text", text: "Import successful" }] };
                }
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        };

        // Fallback for verifier direct access
        (window as any).webmcp = {
            sessionInfo: (window as any).webmcp_session_info,
            listTools: (window as any).webmcp_list_tools,
            invokeTool: (window as any).webmcp_invoke_tool
        };

    }, [dispatch]);

    return null;
};
