export type CheckpointStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface Checkpoint {
  id: string;
  name: string;
  status: CheckpointStatus;
  predicted_time: number; // in minutes
  target_time: number; // in minutes
  headcount: number;
}

export interface DerivedSummary {
  total_checkpoints: number;
  total_headcount: number;
  max_predicted_time: number;
  avg_target_time: number;
  ready_count: number;
}

export interface EvacuationSession {
  schemaVersion: "evacuation-drill-v1";
  exportedAt: string;
  records: Checkpoint[];
  derived: DerivedSummary;
  history: { type: string, timestamp: string }[];
}

// Ensure the window has WebMCP interfaces available
declare global {
  interface Window {
    webmcp_session_info?: () => Promise<{ task_id: string }>;
    webmcp_list_tools?: () => any;
    webmcp_invoke_tool?: (tool_name: string, args: any) => Promise<any>;
    _appStore?: any;
  }
}
