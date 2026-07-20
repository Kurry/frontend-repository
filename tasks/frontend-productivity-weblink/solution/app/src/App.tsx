import { state, toggleTheme } from "./store";
import SessionPanel from "./components/SessionPanel";
import ChatPanel from "./components/ChatPanel";
import FilePanel from "./components/FilePanel";
import TransferLogPanel from "./components/TransferLogPanel";
import ExportDialog from "./components/ExportDialog";
import ImportDialog from "./components/ImportDialog";
import ExportTranscriptDialog from "./components/ExportTranscriptDialog";

export default function App() {
  return (
    <div
      class="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100"
      data-theme={state.ui.theme}
    >
      <header
        class="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3
          backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80"
      >
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold tracking-tight">Weblink</h1>
          <span class="text-xs text-slate-400">peer-to-peer chat &amp; file transfer</span>
        </div>
        <div class="flex items-center gap-3">
          <ExportTranscriptDialog />
          <ImportDialog />
          <ExportDialog />
          <button
            type="button"
            data-testid="theme-toggle"
            class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium transition
              hover:bg-slate-100 hover:shadow-sm active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={toggleTheme}
          >
            {state.ui.theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </header>

      <main class="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr_400px]">
        {/* Left Column: Session and Identity */}
        <div class="flex flex-col gap-4">
           <SessionPanel />
        </div>

        {/* Center Column: Chat Transcript */}
        <div class="flex flex-col gap-4">
           <ChatPanel />
        </div>

        {/* Right Column: File Transfer & Log */}
        <div class="flex flex-col gap-4">
           <FilePanel />
           <TransferLogPanel />
        </div>
      </main>
    </div>
  );
}
