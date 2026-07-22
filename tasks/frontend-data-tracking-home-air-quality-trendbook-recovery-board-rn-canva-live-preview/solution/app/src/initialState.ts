import { HomeAirQualityTrendbookSession } from './types';

export const initialSession: HomeAirQualityTrendbookSession = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', location: 'Living Room', aqi: 45, pm25: 12, status: 'ready' },
    { id: '2', location: 'Bedroom', aqi: 150, pm25: 55, status: 'failed' },
  ],
  derived: {
    summary: '1 failed record requires recovery.',
  },
  history: [],
};
