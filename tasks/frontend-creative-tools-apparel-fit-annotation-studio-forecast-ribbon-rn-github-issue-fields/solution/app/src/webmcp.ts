import { useStore } from './store';
import { z } from 'zod';

const artifactSchema = z.object({
  schemaVersion: z.literal('fit-annotations-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(z.object({
    id: z.string(),
    status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
    'typed-fields': z.object({
      garment: z.string().min(1),
      fitIssue: z.string().min(1),
      measurementDelta: z.number().min(-50).max(50)
    }),
    'duplicate-merge-id': z.string().nullable(),
    'saved-query': z.string().nullable(),
    'release-provenance': z.string().nullable(),
    'forecast-ribbonState': z.object({
      projection: z.string(),
      priority: z.number(),
      release: z.string()
    }).optional()
  })).refine(records => {
    const ids = new Set();
    for (const r of records) {
      if (ids.has(r.id)) return false;
      ids.add(r.id);
    }
    return true;
  }, { message: "Duplicate Record IDs found" })
});

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    "contract_version": "zto-webmcp-v1",
    "modules": [
      "structured-editor-v1",
      "entity-collection-v1",
      "artifact-transfer-v1"
    ]
  });

  window.webmcp_list_tools = () => [
    {
      name: "editor_select",
      description: "Selects a record on the forecast ribbon.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Adjusts the selected record on the forecast ribbon.",
      parameters: {
        type: "object",
        properties: {
          projection: { type: "string" },
          priority: { type: "number" },
          release: { type: "string" }
        },
        required: ["projection", "priority", "release"]
      }
    },
    {
      name: "editor_switch_mode",
      description: "Switches the editor mode between adjust and compare",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["adjust", "compare"] }
        },
        required: ["mode"]
      }
    },
    {
      name: "editor_preview",
      description: "Gets the derived state after ribbon modifications.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "entity_create",
      description: "Creates a new fit annotation record.",
      parameters: {
        type: "object",
        properties: {
          garment: { type: "string" },
          fitIssue: { type: "string" },
          measurementDelta: { type: "number" }
        },
        required: ["garment", "fitIssue", "measurementDelta"]
      }
    },
    {
      name: "entity_select",
      description: "Gets the current collection records.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "entity_update",
      description: "Updates an existing fit annotation record.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          garment: { type: "string" },
          fitIssue: { type: "string" },
          measurementDelta: { type: "number" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Deletes a fit annotation record.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["id", "confirm"]
      }
    },
    {
      name: "artifact_export",
      description: "Exports the current fit-annotations session artifact.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "artifact_import",
      description: "Imports a fit-annotations session artifact.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    },
    {
      name: "artifact_copy",
      description: "Copies the artifact text.",
      parameters: { type: "object", properties: {} }
    }
  ];

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case 'editor_select':
        store.selectRecord(args.id);
        return { success: true, selectedId: args.id };

      case 'editor_update_property':
        store.adjustProjection(args.projection, args.priority, args.release);
        return { success: true };

      case 'editor_switch_mode':
        // No-op for headless mechanics
        return { success: true };

      case 'editor_preview':
        return { success: true, derived: store.derived };

      case 'entity_create':
        store.createRecord({
          status: 'draft',
          'typed-fields': {
            garment: args.garment,
            fitIssue: args.fitIssue,
            measurementDelta: args.measurementDelta
          },
          'duplicate-merge-id': null,
          'saved-query': null,
          'release-provenance': null
        });
        return { success: true };

      case 'entity_select':
        return { success: true, records: store.records };

      case 'entity_update': {
        if (!args.garment && !args.fitIssue && args.measurementDelta === undefined) {
            return { success: false, error: "Missing fields to update" };
        }
        const record = store.records.find(r => r.id === args.id);
        if (!record) return { success: false, error: "Record not found" };

        const updatedFields = {
            garment: args.garment ?? record['typed-fields'].garment,
            fitIssue: args.fitIssue ?? record['typed-fields'].fitIssue,
            measurementDelta: args.measurementDelta ?? record['typed-fields'].measurementDelta
        };

        store.updateRecord(args.id, {
          'typed-fields': updatedFields
        });
        return { success: true };
      }

      case 'entity_delete':
        if (!args.confirm) return { success: false, error: "confirm required" };
        store.deleteRecord(args.id);
        return { success: true };

      case 'artifact_export':
      case 'artifact_copy':
        return {
          success: true,
          artifact: {
            schemaVersion: 'fit-annotations-v1',
            exportedAt: new Date().toISOString(),
            records: store.records,
            derived: store.derived,
            history: store.history
          }
        };

      case 'artifact_import':
        try {
          const result = artifactSchema.safeParse(args.data);
          if (!result.success) {
            return { success: false, error: "Validation Error" };
          }
          store.importArtifact(args.data);
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }

      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
