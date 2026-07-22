export type ConnectionMode = 'demo' | 'loopback' | 'api-key';

export interface ProviderResource {
  id: string;
  name: string;
  type: 'consumption' | 'balance';
  limit?: number;
  used?: number;
  remaining?: number;
  unit: string;
  resetAt?: string;
  historicalPoints?: { date: string; value: number }[];
}

export interface ProviderSnapshot {
  providerId: string;
  name: string;
  status: 'fresh' | 'updating' | 'stale' | 'error' | 'disabled';
  lastUpdated?: string;
  errorMessage?: string;
  resources: ProviderResource[];
}

export interface WorkspaceState {
  mode: ConnectionMode;
  loopbackUrl: string | null;
  providers: ProviderSnapshot[];
  pins: { providerId: string; resourceId: string }[];
  dateRange: { start: string; end: string } | null;
}

export interface UsageRefreshEvent {
  sequence: number;
  providerId: string;
  timestamp: string;
  phase: 'detect' | 'credential' | 'fetch' | 'normalize' | 'cache' | 'complete';
  kind: 'start' | 'tool-call' | 'tool-result' | 'data' | 'warning' | 'error' | 'complete';
  payload: any;
}
