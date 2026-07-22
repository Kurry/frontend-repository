import { HomeAirQualityTrendbookSession } from './types';

export const setupWebMCP = (
  getSession: () => HomeAirQualityTrendbookSession,
  setSession: (s: HomeAirQualityTrendbookSession) => void
) => {
  (window as any).webmcp_session_info = () => ({
    schemaVersion: getSession().schemaVersion,
    sessionStartedAt: getSession().exportedAt,
  });

  (window as any).webmcp_list_tools = () => ({
    tools: [
      { name: 'query_state', description: 'Query the current state of the application.' },
      { name: 'import_artifact', description: 'Import an exported artifact.' }
    ],
  });

  (window as any).webmcp_invoke_tool = (tool: string, args: any) => {
    if (tool === 'query_state') {
      return getSession();
    }
    if (tool === 'import_artifact') {
       if (args?.schemaVersion === 'v1' && args?.records) {
          setSession(args as HomeAirQualityTrendbookSession);
          return { success: true };
       }
       return { success: false, error: 'Invalid artifact' };
    }
    throw new Error(`Unknown tool: ${tool}`);
  };
};
