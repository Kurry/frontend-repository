import type { ClassroomLessonArcPlannerSession } from './types';

export const initWebMCP = (api: {
  getRecords: () => any[];
  getDerived: () => any;
  exportState: () => ClassroomLessonArcPlannerSession;
  importState: (data: any) => boolean;
  executeProvenanceAtlasMutation: (id: string, evidence: string) => void;
  clearState: () => void;
}) => {
  (window as any).webmcp_session_info = {
    name: 'eval-intelligence/frontend-planning-classroom-lesson-arc-planner-provenance-atlas-rn-slack-canvas',
    status: 'active'
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'entity_create_record',
        description: 'No-op for standard entity contract.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'entity_update_record',
        description: 'Executes the provenance atlas mutation to trace a selected record to source evidence and quarantine a bad lineage.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            evidence: { type: 'string' }
          },
          required: ['id', 'evidence']
        }
      },
      {
        name: 'entity_delete_record',
        description: 'Clear state',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'artifact_export_session_json',
        description: 'Exports the current session state as a JSON artifact.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'artifact_import_session_json',
        description: 'Imports a JSON artifact to restore the session state.',
        parameters: {
          type: 'object',
          properties: {
            sessionData: { type: 'object' }
          },
          required: ['sessionData']
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    switch (name) {
      case 'entity_create_record':
        return { success: true };
      case 'entity_update_record':
        if (args.id && args.evidence) {
          api.executeProvenanceAtlasMutation(args.id, args.evidence);
          return { success: true, records: api.getRecords() };
        }
        return { success: false, error: 'Missing id or evidence' };
      case 'entity_delete_record':
        api.clearState();
        return { success: true };
      case 'artifact_export_session_json':
        return { success: true, artifact: api.exportState() };
      case 'artifact_import_session_json':
        const success = api.importState(args.sessionData);
        return { success, records: api.getRecords() };
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  };
};
