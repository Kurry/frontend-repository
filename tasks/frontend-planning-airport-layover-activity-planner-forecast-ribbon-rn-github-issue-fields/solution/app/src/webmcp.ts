import {
  entityCollectionV1,
  artifactTransferV1,
  type CompiledTool,
  type InvokeContext
} from '@zto/webmcp-contracts';

declare global {
  interface Window {
    __APP_STATE__: any;
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<CompiledTool[]>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

export function registerWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-planning-airport-layover-activity-planner-forecast-ribbon-rn-github-issue-fields"
  });

  const entityTools = entityCollectionV1.compile(
    {
      entity: "layover_activity",
      entity_operations: ["create", "select", "update", "delete"],
      entity_fields: ["title", "duration", "cost", "status"],
    },
    {
      create: (input) => {
        const state = window.__APP_STATE__;
        const newRecord = {
          id: crypto.randomUUID(),
          title: input.fields?.title || 'New Activity',
          duration: parseInt(input.fields?.duration || '60'),
          cost: parseInt(input.fields?.cost || '0'),
          status: (input.fields?.status || 'draft') as any
        };
        state.setSession((prev: any) => ({
          ...prev,
          records: [...prev.records, newRecord],
          derived: state.calculateDerived([...prev.records, newRecord]),
          history: [...prev.history, { records: prev.records, derived: prev.derived }]
        }));
        return { status: "success", entity: newRecord };
      },
      select: (input) => {
        const state = window.__APP_STATE__;
        const record = state.session.records.find((r: any) => r.id === input.id);
        if (record) {
          return { status: "success", entity: record };
        }
        return { status: "error", message: "Not found" };
      },
      update: (input) => {
        const state = window.__APP_STATE__;
        let updatedRecord = null;
        state.setSession((prev: any) => {
          const idx = prev.records.findIndex((r: any) => r.id === input.id);
          if (idx === -1) return prev;
          const newRecords = [...prev.records];
          newRecords[idx] = { ...newRecords[idx], ...input.fields };
          if (input.fields.duration) newRecords[idx].duration = parseInt(input.fields.duration);
          if (input.fields.cost) newRecords[idx].cost = parseInt(input.fields.cost);
          updatedRecord = newRecords[idx];
          return {
            ...prev,
            records: newRecords,
            derived: state.calculateDerived(newRecords),
            history: [...prev.history, { records: prev.records, derived: prev.derived }]
          };
        });
        return { status: "success", entity: updatedRecord };
      },
      delete: (input) => {
        const state = window.__APP_STATE__;
        state.setSession((prev: any) => {
          const newRecords = prev.records.filter((r: any) => r.id !== input.id);
          return {
            ...prev,
            records: newRecords,
            derived: state.calculateDerived(newRecords),
            history: [...prev.history, { records: prev.records, derived: prev.derived }]
          };
        });
        return { status: "success" };
      }
    }
  );

  const artifactTools = artifactTransferV1.compile(
    {
      artifact_operations: ["export", "import"],
      export_formats: ["layover-plan-v1"],
      import_modes: ["layover-plan-v1"]
    },
    {
      export: () => {
        const state = window.__APP_STATE__;
        const exportData = {
          ...state.session,
          exportedAt: new Date().toISOString()
        };
        return { status: "success", format: "layover-plan-v1", session: exportData };
      },
      import: (input) => {
        return { status: "success", mode: input.mode };
      }
    }
  );

  const tools = [...entityTools, ...artifactTools];

  window.webmcp_list_tools = async () => tools;

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    const ctx: InvokeContext = {
        signal: new AbortController().signal,
        navigationEpoch: 1,
        scopeId: 'app',
        toolName: name
    };
    return await tool.execute(args, ctx);
  };
}
