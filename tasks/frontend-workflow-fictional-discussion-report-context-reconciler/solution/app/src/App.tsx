import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    webmcp_session_info: () => string;
    webmcp_list_tools: () => string;
    webmcp_invoke_tool: (toolId: string, args: Record<string, any>) => Promise<string>;
  }
}

function App() {
  const [toolsRegistered, setToolsRegistered] = useState(false);

  useEffect(() => {
    window.webmcp_session_info = () => JSON.stringify({ state: "running" });
    window.webmcp_list_tools = () => JSON.stringify({
      tools: [
        { id: "context_get_casebook_session", inputSchema: { type: "object", properties: {} } },
        { id: "context_list_workspaces", inputSchema: { type: "object", properties: {} } },
        { id: "context_list_threads", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_thread", inputSchema: { type: "object", properties: { threadId: { type: "string" } } } },
        { id: "context_list_messages", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_message", inputSchema: { type: "object", properties: { messageId: { type: "string" } } } },
        { id: "context_list_reports", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_report", inputSchema: { type: "object", properties: { reportId: { type: "string" } } } },
        { id: "context_get_role_evidence", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_duplicate_candidates", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_queue", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_history", inputSchema: { type: "object", properties: {} } },
        { id: "context_get_artifact_preview", inputSchema: { type: "object", properties: {} } },
        { id: "context_preview_context_window", inputSchema: { type: "object", properties: {} } },
        { id: "context_commit_context_window", inputSchema: { type: "object", properties: {} } },
        { id: "context_cancel_context_window", inputSchema: { type: "object", properties: {} } },
        { id: "context_set_selection", inputSchema: { type: "object", properties: {} } },
        { id: "context_set_filters", inputSchema: { type: "object", properties: {} } },
        { id: "context_set_viewport", inputSchema: { type: "object", properties: {} } },
        { id: "context_preview_report_merge", inputSchema: { type: "object", properties: {} } },
        { id: "context_commit_report_merge", inputSchema: { type: "object", properties: {} } },
        { id: "context_cancel_report_merge", inputSchema: { type: "object", properties: {} } },
        { id: "context_decline_duplicate", inputSchema: { type: "object", properties: {} } },
        { id: "context_set_decision", inputSchema: { type: "object", properties: {} } },
        { id: "context_append_note", inputSchema: { type: "object", properties: {} } },
        { id: "context_resolve_note", inputSchema: { type: "object", properties: {} } },
        { id: "context_selective_undo", inputSchema: { type: "object", properties: {} } },
        { id: "context_selective_redo", inputSchema: { type: "object", properties: {} } },
        { id: "context_fork_branch", inputSchema: { type: "object", properties: {} } },
        { id: "context_compare_branch", inputSchema: { type: "object", properties: {} } },
        { id: "context_choose_branch", inputSchema: { type: "object", properties: {} } },
        { id: "context_advance_logical_time", inputSchema: { type: "object", properties: {} } },
        { id: "context_preview_tombstone_rebase", inputSchema: { type: "object", properties: {} } },
        { id: "context_commit_tombstone_rebase", inputSchema: { type: "object", properties: {} } },
        { id: "context_approve_report", inputSchema: { type: "object", properties: {} } },
        { id: "context_preview_enqueue", inputSchema: { type: "object", properties: {} } },
        { id: "context_commit_enqueue", inputSchema: { type: "object", properties: {} } },
        { id: "context_cancel_enqueue", inputSchema: { type: "object", properties: {} } },
        { id: "context_preview_dispatch", inputSchema: { type: "object", properties: {} } },
        { id: "context_commit_dispatch", inputSchema: { type: "object", properties: {} } },
        { id: "context_cancel_dispatch", inputSchema: { type: "object", properties: {} } },
        { id: "context_pause_queue", inputSchema: { type: "object", properties: {} } },
        { id: "context_resume_queue", inputSchema: { type: "object", properties: {} } },
        { id: "context_refill_tokens", inputSchema: { type: "object", properties: {} } },

        { id: "artifact_validate_import", inputSchema: { type: "object", properties: {} } },
        { id: "artifact_confirm_import", inputSchema: { type: "object", properties: {} } },
        { id: "artifact_export_casebook", inputSchema: { type: "object", properties: {} } },
        { id: "artifact_reset_casebook", inputSchema: { type: "object", properties: {} } }
      ]
    });
    window.webmcp_invoke_tool = async (toolId, args) => JSON.stringify({ success: true, toolId, args });
    setToolsRegistered(true);
  }, []);

  return (
    <div className="p-8 font-sans bg-gray-50 min-h-screen text-gray-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Fictional Discussion Report Context Reconciler</h1>
        <p className="text-gray-600 mt-2">A hard browser threaded-context review and resumable queue app.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Context Window</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
              Chronology brush & graph rendering placeholder
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span className="font-medium">User {i}</span>
                    <span>12:0{i} PM</span>
                  </div>
                  <p className="text-gray-700">Sample discussion message content {i}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Role Checklist</h2>
            <ul className="space-y-3">
              {['Target', 'Root', 'Parent', 'Preceding Sibling', 'Following Sibling', 'Referenced'].map((role) => (
                <li key={role} className="flex items-center text-sm">
                  <div className="w-4 h-4 rounded-full border border-gray-300 mr-3 flex-shrink-0"></div>
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Tokens</span>
              <div className="flex space-x-1">
                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">WebMCP Tools</h2>
            <div className="text-sm">
              Status: {toolsRegistered ? <span className="text-green-600 font-medium">Registered</span> : <span className="text-red-600 font-medium">Pending</span>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
