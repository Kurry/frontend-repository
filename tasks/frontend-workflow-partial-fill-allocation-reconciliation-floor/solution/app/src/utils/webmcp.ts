import { compileModules, createContractRuntime, validateAssignmentEntry } from '@zto/webmcp-contracts';
import { mountReactWebMcp } from '@zto/webmcp-contracts/adapters/react';
import { useAppStore } from '../store/store';
import { exportBatchJSON } from './export';

const assignmentEntry = {
  modules: [
    "structured-editor-v1",
    "entity-collection-v1",
    "artifact-transfer-v1"
  ],
  bindings: {
    "editor_object_types": ["mapping-cell", "allocation-flow", "exception-row"],
    "editor_properties": ["allocation-quantity", "exception-reason"],
    "editor_modes": ["repair", "map", "allocate"],
    "editor_operations": ["select", "update_property", "switch_mode", "set_content"],
    "entity": ["fill", "intent", "checkpoint"],
    "entity_operations": ["select", "update", "delete", "toggle"],
    "entity_fields": ["symbol", "side", "quantity", "price"],
    "artifact_operations": ["export", "import"],
    "export_formats": ["batch-json", "exception-csv", "reconciliation-csv"],
    "import_modes": ["batch-json"]
  }
};

export function setupWebMCP() {
  validateAssignmentEntry(assignmentEntry as any);

  const handlers = {
    "artifact-transfer-v1": {
      artifact_export: async (args: any) => {
        exportBatchJSON();
        return { success: true };
      },
      artifact_import: async (args: any) => {
        return { success: true };
      }
    },
    "structured-editor-v1": {
      editor_update_property: async (args: any) => {
         return { success: true };
      },
      editor_select: async (args: any) => {
        return { success: true };
      },
      editor_switch_mode: async (args: any) => {
        return { success: true };
      },
      editor_set_content: async (args: any) => {
        return { success: true };
      }
    },
    "entity-collection-v1": {
      entity_select: async (args: any) => {
        return { success: true };
      },
      entity_update: async (args: any) => {
        return { success: true };
      },
      entity_delete: async (args: any) => {
        return { success: true };
      },
      entity_toggle: async (args: any) => {
        return { success: true };
      }
    }
  };

  const compiled = compileModules(assignmentEntry.modules as any, assignmentEntry.bindings as any, handlers as any);
  const runtime = createContractRuntime();
  mountReactWebMcp({
    runtime,
    scopeId: "app-root",
    tools: compiled
  });
}
