export type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived' | 'failed' | 'resolved';

export interface Record {
  id: string;
  location: string;
  aqi: number;
  pm25: number;
  status: Status;
}

export interface HomeAirQualityTrendbookSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Record[];
  derived: {
    summary: string;
  };
  history: any[];
}
