import { component$, $, useStore, useVisibleTask$ } from '@builder.io/qwik';
import type { PortfolioState, HistoryManager } from './types';
import {
  loadState,
  saveState,
  createHistoryManager,
  pushHistory,
} from './store';
import { registerWebMcp } from './webmcp';

// Editor components
import {
  ProfileEditor,
  ProjectsEditor,
  SkillsEditor,
  TestimonialsEditor,
  ContactEditor,
} from './components/editor';

// Control components
import {
  ThemePicker,
  DensityToggle,
  SectionToggles,
  SectionReorder,
  DraftManager,
  CompletenessChecklist,
  UndoRedo,
  HistoryPanel,
} from './components/controls';

// Preview component
import { LivePreview } from './components/preview';

export default component$(() => {
  // Initialize state from localStorage or defaults
  const state = useStore<PortfolioState>(loadState());

  // Initialize history manager with current content
  const history = useStore<HistoryManager>(
    createHistoryManager(state.content)
  );

  // Required WebMCP delivery surface — binds to the same store commands the UI uses.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    registerWebMcp(state, history);
  });

  const handleDownloadPDF = $(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  });

  const handleApplyScenario = $(() => {
    // Push current state as an explicit snapshot
    pushHistory(history, state.content, 'Apply Scenario Change');
    saveState(state);
  });

  return (
    <div class="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Top Bar */}
      <header class="sticky top-0 z-50 border-b no-print" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--color-primary)' }}>
              PortfolioFrame
            </h1>
            <span class="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
              Draft
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="btn-secondary"
              onClick$={handleDownloadPDF}
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Editor + Preview */}
      <div class="max-w-screen-2xl mx-auto flex flex-col lg:flex-row no-print">
        {/* Editor Panel */}
        <aside class="editor-panel w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 overflow-y-auto lg:h-[calc(100vh-57px)] p-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
          {/* Undo/Redo + History */}
          <UndoRedo history={history} state={state} onApply={handleApplyScenario} />
          <HistoryPanel history={history} state={state} />

          {/* Theme & Density */}
          <ThemePicker state={state} />
          <DensityToggle state={state} />

          {/* Section Controls */}
          <SectionToggles state={state} />
          <SectionReorder state={state} />

          {/* Content Editors (always visible in editor, visibility only affects preview) */}
          <ProfileEditor state={state} history={history} />
          <ProjectsEditor state={state} history={history} />
          <SkillsEditor state={state} history={history} />
          <TestimonialsEditor state={state} history={history} />
          <ContactEditor state={state} history={history} />

          {/* Drafts & Checklist */}
          <DraftManager state={state} history={history} />
          <CompletenessChecklist state={state} />

          <div class="h-8" />
        </aside>

        {/* Preview Panel */}
        <main class="flex-1 min-w-0 p-4 lg:p-6 lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          <div
            class="mx-auto rounded-2xl border shadow-sm"
            style={{
              maxWidth: '800px',
              borderColor: 'var(--color-border)',
              background: '#ffffff',
              minHeight: '600px',
            }}
          >
            <div class="p-6 sm:p-8">
              <LivePreview state={state} />
            </div>
          </div>
        </main>
      </div>

      {/* Print-only output (hidden on screen, shown during print) */}
      <div class="print-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <LivePreview state={state} />
      </div>
    </div>
  );
});
