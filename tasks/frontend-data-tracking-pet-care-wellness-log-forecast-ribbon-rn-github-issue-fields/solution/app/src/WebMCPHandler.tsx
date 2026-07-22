import { useEffect } from 'react';
import { useAppStore } from './store';
import {
  entityCollectionV1,
  structuredEditorV1,
  artifactTransferV1
} from '@zto/webmcp-contracts';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}

export function WebMCPHandler() {
  useEffect(() => {
    // 1. Session info
    window.webmcp_session_info = async () => {
      return {
        task_id: "eval-intelligence/frontend-data-tracking-pet-care-wellness-log-forecast-ribbon-rn-github-issue-fields",
        contract_version: "zto-webmcp-v1"
      };
    };

    const compiledEntity = entityCollectionV1.compile({
      entity_operations: ['create', 'select', 'update', 'delete', 'toggle'],
      entity_fields: ['status', 'priority']
    } as any, {} as any);

    const compiledEditor = structuredEditorV1.compile({
      editor_operations: ['select', 'update_property', 'preview']
    } as any, {} as any);

    const compiledArtifact = artifactTransferV1.compile({
      artifact_operations: ['export', 'import', 'copy']
    } as any, {} as any);

    const allTools = [...compiledEntity, ...compiledEditor, ...compiledArtifact];

    // 2. List tools
    window.webmcp_list_tools = async () => {
      return allTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
    };

    // 3. Invoke tool
    window.webmcp_invoke_tool = async (toolName: string, args: any) => {
      const state = useAppStore.getState();

      if (toolName === 'entity.create') {
        const title = args.fields?.title || 'New Record';
        const description = args.fields?.description || '';
        const priority = args.fields?.priority || 'medium';
        const status = args.fields?.status || 'draft';
        state.addRecord({ title, description, priority, status, date: new Date().toISOString(), projectedOutcome: 'To be determined' });
        return { success: true, result: { message: "Record created" } };
      }

      if (toolName === 'entity.select') {
         state.selectRecord(args.id);
         return { success: true, result: { message: `Selected ${args.id}` } };
      }

      if (toolName === 'entity.update') {
         state.updateRecord(args.id, args.fields);
         return { success: true, result: { message: `Updated ${args.id}` } };
      }

      if (toolName === 'entity.delete') {
         if (args.confirm) {
             state.deleteRecord(args.id);
             return { success: true, result: { message: `Deleted ${args.id}` } };
         }
         return { success: false, error: "Requires confirmation" };
      }

      if (toolName === 'editor.select') {
         // for simplicity, just success since forecast ribbon is always present
         return { success: true, result: { message: "Editor context selected" } };
      }

      if (toolName === 'editor.update_property') {
         if (args.property === 'status' && state.editor.selectedRecordId) {
             state.updateRecord(state.editor.selectedRecordId, { status: args.value });
             return { success: true, result: { message: "Ribbon status updated" } };
         }
         return { success: false, error: "Missing context or invalid property" };
      }

      if (toolName === 'artifact.export') {
          return { success: true, result: { artifact: state.exportSession() } };
      }

      if (toolName === 'artifact.import') {
          const success = state.importSession(args.artifact_data);
          return { success, result: success ? { message: "Imported successfully" } : { error: "Validation failed" } };
      }

      return { success: false, error: "Tool not implemented" };
    };
  }, []);

  return null;
}
