export type PanelStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ComicPanel {
  id: string;
  title: string;
  status: PanelStatus;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DerivedState {
  summary: {
    total: number;
    byStatus: Record<PanelStatus, number>;
    capacityUsed: number; // percentage 0-100
  };
}

export interface SessionHistory {
  timestamp: string;
  action: string;
}

export interface ComicPanelRhythmBoardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ComicPanel[];
  derived: DerivedState;
  history: SessionHistory[];
}

export interface WebMCPSessionInfo {
  name: string;
  version: string;
}

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

declare global {
  interface Window {
    webmcp_session_info: WebMCPSessionInfo;
    webmcp_list_tools: () => WebMCPTool[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}
