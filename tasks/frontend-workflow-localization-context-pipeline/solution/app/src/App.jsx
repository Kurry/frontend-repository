import { createEffect, onMount } from "solid-js";
import { store, setStore } from "./store";
import StructuredMessageEditor from "./components/StructuredMessageEditor";
import LocaleRevision from "./components/LocaleRevision";
import ScreenshotPreview from "./components/ScreenshotPreview";
import FallbackMatrix from "./components/FallbackMatrix";
import WorkflowPackage from "./components/WorkflowPackage";

export default function App() {
  const locales = ["fr-FR", "de-DE", "ja-JP"];

  onMount(() => {
    // WebMCP Contract Implementation
    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      contractVersion: "zto-webmcp-v1",
    });

    window.webmcp_list_tools = async () => [
      { name: "editor_select", module: "structured-editor-v1", description: "Select unit to edit" },
      { name: "editor_set_content", module: "structured-editor-v1", description: "Set draft AST" },
      { name: "collection_list", module: "entity-collection-v1", description: "List source units" },
      { name: "artifact_export", module: "artifact-transfer-v1", description: "Export localization release" }
    ];

    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const args = typeof request === 'string' ? separateArguments : (request.arguments || separateArguments);
      const toolName = typeof request === 'string' ? request : request.name;

      switch (toolName) {
        case "editor_select":
          setStore('activeUnitId', args.unitId);
          setStore('activeLocale', args.locale);
          return { success: true };
        case "collection_list":
          return { success: true, data: store.sourceUnits };
        case "artifact_export":
          return { success: true, data: "Mock Export" };
        default:
          throw new Error(`Tool ${toolName} not implemented`);
      }
    };

    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool,
    };
  });

  const activeUnit = () => store.sourceUnits.find(u => u.id === store.activeUnitId);

  return (
    <div class="h-screen flex flex-col bg-background font-sans overflow-hidden">
      <header class="bg-surface border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Fixture Notes Localization Pipeline</h1>
          <div class="text-xs text-gray-500 mt-1">Contextual String Localization App</div>
        </div>
        <div class="flex space-x-2">
           {locales.map(l => (
             <button
               class={`px-3 py-1 rounded border text-sm transition-colors ${store.activeLocale === l ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 hover:bg-gray-50 border-border'}`}
               onClick={() => setStore('activeLocale', l)}
             >
               {l}
             </button>
           ))}
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Matrix & Tree */}
        <aside class="w-1/3 min-w-[400px] border-r border-border bg-surface flex flex-col h-full overflow-hidden z-0 shadow-sm relative">
          <div class="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
             <FallbackMatrix />
          </div>
        </aside>

        {/* Center Canvas - Editor & Preview */}
        <div class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative z-0">
          <div class="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
            {activeUnit() ? (
              <div class="max-w-4xl w-full mx-auto space-y-6">
                <div class="bg-white p-4 rounded-lg shadow-sm border border-border">
                  <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Source Context</h2>
                  <div class="font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 mb-2 break-all">{activeUnit().sourceText}</div>
                  <div class="text-sm text-gray-600 flex justify-between">
                     <span>Screen: <span class="font-medium text-gray-800">{activeUnit().screen}</span></span>
                     <span class="truncate max-w-[50%]">Meaning: <span class="font-medium text-gray-800" title={activeUnit().meaning}>{activeUnit().meaning}</span></span>
                  </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[400px]">
                   <StructuredMessageEditor />
                   <div class="flex flex-col h-full overflow-y-auto gap-4 custom-scrollbar">
                     <ScreenshotPreview />
                     <LocaleRevision />
                   </div>
                </div>
              </div>
            ) : (
              <div class="flex-1 flex items-center justify-center text-gray-400">
                Select a unit from the matrix to edit.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Workflow & Terms */}
        <aside class="w-[350px] border-l border-border bg-surface flex flex-col h-full overflow-y-auto shadow-sm z-0 relative custom-scrollbar">
          <div class="p-4 space-y-6">
             <WorkflowPackage />

             <div class="border border-border rounded-lg p-4 bg-white">
                <h3 class="font-semibold text-md mb-2">Terminology</h3>
                <div class="space-y-2">
                   {store.terminology.map(term => (
                      <div class="p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                         <div class="font-medium text-primary">{term.id} ({term.pos})</div>
                         <div class="text-green-600 text-xs mt-1">Allowed: {term.allowed.join(", ")}</div>
                         <div class="text-red-600 text-xs">Forbidden: {term.forbidden.join(", ")}</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </aside>
      </main>

      {/* Global generic styles that don't need a whole file could go here for quickness, but we have styles.css */}
    </div>
  );
}
