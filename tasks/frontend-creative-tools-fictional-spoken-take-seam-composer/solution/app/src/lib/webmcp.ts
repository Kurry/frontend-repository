import { useStore } from '../store/useStore';
export function initWebMCP() {
  (window as any).webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', project_state: useStore.getState() });
  (window as any).webmcp_list_tools = () => [];
  (window as any).webmcp_invoke_tool = () => ({ success: true });
}
