import { getSnapshot, updateState, setStateDirectly } from './store';
import type { WorkTask, SessionArtifact, RecordStatus } from './types';
import { formatISO } from 'date-fns';

export function registerWebMCP() {
  window.webmcp_session_info = {
    task: "eval-intelligence/frontend-planning-community-garden-workday-planner-replay-timeline-rn-lightroom-editing",
    mode: "oracle",
    version: "1.0.0"
  };

  const tools = [
    {
      name: "create_record",
      description: "Create a new work task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
          description: { type: "string" }
        },
        required: ["title"]
      }
    },
    {
      name: "read_record",
      description: "Read a specific work task.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "update_record",
      description: "Update an existing work task.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string" },
          description: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "delete_record",
      description: "Archive a work task (does not permanently delete).",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "list_records",
      description: "List all work tasks.",
      parameters: {
        type: "object",
        properties: { status: { type: "string" } }
      }
    },
    {
      name: "select",
      description: "Select a timeline event or record in the structured editor.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, type: { type: "string", enum: ["record", "timeline_event"] } },
        required: ["id", "type"]
      }
    },
    {
      name: "update_property",
      description: "Update a property of the selected object.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } },
        required: ["id", "property", "value"]
      }
    },
    {
      name: "export_session_json",
      description: "Export the current session state as a JSON artifact.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "import_session_json",
      description: "Import a JSON artifact to replace the current session state.",
      parameters: {
        type: "object",
        properties: { data: { type: "object" } },
        required: ["data"]
      }
    }
  ];

  window.webmcp_list_tools = async () => tools;

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const state = getSnapshot();

    switch (name) {
      case 'create_record': {
        const now = new Date();
        const newTask: WorkTask = {
          id: `task-${now.getTime()}`,
          title: args.title,
          status: (args.status as RecordStatus) || 'draft',
          description: args.description || '',
          estimatedHours: 1,
          priority: 'medium'
        };
        updateState(prev => ({
          ...prev,
          records: [...prev.records, newTask],
          history: [...prev.history, {
            id: `evt-${newTask.id}-${now.getTime()}`,
            taskId: newTask.id,
            timestamp: formatISO(now),
            mutationType: 'create',
            previousState: null,
            newState: newTask
          }],
          selectedTaskId: newTask.id
        }));
        return { result: newTask };
      }

      case 'read_record': {
        const record = state.records.find(r => r.id === args.id);
        if (!record) throw new Error(`Record ${args.id} not found`);
        return { result: record };
      }

      case 'update_record': {
        const record = state.records.find(r => r.id === args.id);
        if (!record) throw new Error(`Record ${args.id} not found`);
        const updated = { ...record, ...args };
        const now = new Date();
        updateState(prev => ({
          ...prev,
          records: prev.records.map(r => r.id === args.id ? updated : r),
          history: [...prev.history, {
            id: `evt-${args.id}-${now.getTime()}`,
            taskId: args.id,
            timestamp: formatISO(now),
            mutationType: 'update',
            previousState: record,
            newState: updated
          }]
        }));
        return { result: updated };
      }

      case 'delete_record': {
        const record = state.records.find(r => r.id === args.id);
        if (!record) throw new Error(`Record ${args.id} not found`);
        const updated = { ...record, status: 'archived' as RecordStatus };
        const now = new Date();
        updateState(prev => ({
          ...prev,
          records: prev.records.map(r => r.id === args.id ? updated : r),
          history: [...prev.history, {
            id: `evt-${args.id}-${now.getTime()}`,
            taskId: args.id,
            timestamp: formatISO(now),
            mutationType: 'archive',
            previousState: record,
            newState: updated
          }]
        }));
        return { result: { success: true } };
      }

      case 'list_records': {
        let records = state.records;
        if (args.status) {
          records = records.filter(r => r.status === args.status);
        }
        return { result: records };
      }

      case 'select': {
        if (args.type === 'record') {
          updateState(prev => ({ ...prev, selectedTaskId: args.id, activeTimelineEventId: null }));
          return { result: { success: true, selectedRecord: args.id } };
        } else if (args.type === 'timeline_event') {
          updateState(prev => ({ ...prev, activeTimelineEventId: args.id }));
          return { result: { success: true, activeEvent: args.id } };
        }
        throw new Error('Invalid select type');
      }

      case 'update_property': {
        // Fallback or generic update wrapper
        const record = state.records.find(r => r.id === args.id);
        if (!record) throw new Error(`Record ${args.id} not found`);
        const updated = { ...record, [args.property]: args.value };
        const now = new Date();
        updateState(prev => ({
          ...prev,
          records: prev.records.map(r => r.id === args.id ? updated : r),
          history: [...prev.history, {
            id: `evt-${args.id}-${now.getTime()}`,
            taskId: args.id,
            timestamp: formatISO(now),
            mutationType: 'update',
            previousState: record,
            newState: updated
          }]
        }));
        return { result: updated };
      }

      case 'export_session_json': {
        const artifact: SessionArtifact = {
          schemaVersion: 'v1',
          exportedAt: formatISO(new Date()),
          records: state.records,
          derived: {
            totalTasks: state.records.length,
            draftCount: state.records.filter(r => r.status === 'draft').length,
            readyCount: state.records.filter(r => r.status === 'ready').length,
            changedCount: state.records.filter(r => r.status === 'changed').length,
            archivedCount: state.records.filter(r => r.status === 'archived').length,
          },
          history: state.history
        };
        return { result: artifact };
      }

      case 'import_session_json': {
        const { data } = args;
        if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(data.records) || !Array.isArray(data.history)) throw new Error('Invalid data format');

        // Regenerate exportedAt for new session (per requirements)
        data.exportedAt = formatISO(new Date());

        updateState(prev => ({
          ...prev,
          records: data.records,
          history: data.history,
          selectedTaskId: null,
          activeTimelineEventId: null,
          filterStatus: 'all'
        }));
        return { result: { success: true } };
      }

      default:
        throw new Error(`Tool ${name} not implemented`);
    }
  };
}
