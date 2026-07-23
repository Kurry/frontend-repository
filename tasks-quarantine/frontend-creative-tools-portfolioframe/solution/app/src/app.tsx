import { component$, $, useStore, useVisibleTask$, useSignal } from '@builder.io/qwik';
import type { PortfolioState } from './types';
import type { HistoryManager } from './store';
import { loadState, saveState, createHistoryManager, completenessCount } from './store';
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
  LayoutPresets,
  SectionToggles,
  SectionReorder,
  DraftManager,
  CompletenessChecklist,
  UndoRedo,
  HistoryPanel,
} from './components/controls';

// Preview component
import { LivePreview } from './components/preview';
import { ExportPanel } from './components/ExportPanel';
import { CommandPalette } from './components/CommandPalette';

const ONBOARDING_KEY = 'portfolioframe_onboarded_v1';
const LAST_SECTION_KEY = 'portfolioframe_last_section';

export default component$(() => {
  // Initialize state from localStorage or defaults
  const state = useStore<PortfolioState>(loadState());

  // Initialize history manager with the current full visible state
  const history = useStore<HistoryManager>(createHistoryManager(state));

  // Export package surface (shared with the WebMCP artifact tools)
  const isExportOpen = useSignal(false);
  const exportTab = useSignal<'json' | 'markdown'>('json');
  const isImporting = useSignal(false);
  const importToast = useSignal('');
  const showCoachmark = useSignal(false);

  // Required WebMCP delivery surface — binds to the same store commands the UI
  // uses, and opens the same Export package surfaces a click would.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    registerWebMcp(state, history, {
      openExport: (tab) => {
        exportTab.value = tab;
        isImporting.value = false;
        isExportOpen.value = true;
      },
      openImport: () => {
        exportTab.value = 'json';
        isImporting.value = true;
        isExportOpen.value = true;
      },
    });
  });

  // First-run coachmarks (non-blocking) + last-focused editor section recall.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) showCoachmark.value = true;
      const lastSection = localStorage.getItem(LAST_SECTION_KEY);
      if (lastSection) {
        const el = Array.from(document.querySelectorAll('aside h2')).find(
          (h) => (h.textContent ?? '').trim() === lastSection
        );
        el?.scrollIntoView({ block: 'nearest' });
      }
    } catch {
      // storage unavailable — skip personalization
    }
  });

  const dismissCoachmark = $(() => {
    showCoachmark.value = false;
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // ignore
    }
  });

  const rememberSection = $((e: FocusEvent) => {
    const target = e.target as HTMLElement | null;
    const section = target?.closest('.editor-section');
    const heading = section?.querySelector('h2');
    const label = heading?.textContent?.trim();
    if (label) {
      try {
        localStorage.setItem(LAST_SECTION_KEY, label);
      } catch {
        // ignore
      }
    }
  });

  const handleDownloadPDF = $(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  });

  const handleImported = $(() => {
    importToast.value = 'Import successful — editor, preview, Completeness, and both export tabs now match the imported package.';
    window.setTimeout(() => {
      importToast.value = '';
    }, 4000);
  });

  const count = completenessCount(state);

  return (
    <div class="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Top Bar */}
      <header
        class="sticky top-0 z-50 border-b no-print"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              PortfolioFrame
            </h1>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#f5f3ff', color: '#6d28d9', fontWeight: 500 }}
              title="Completeness summary"
            >
              {count.done} of {count.total} complete
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="btn-secondary"
              onClick$={() => {
                exportTab.value = 'json';
                isImporting.value = false;
                isExportOpen.value = true;
              }}
            >
              Export package
            </button>
            <button type="button" class="btn-primary" onClick$={handleDownloadPDF}>
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Command Palette and Export Panel */}
      <CommandPalette
        state={state}
        history={history}
        onOpenExport={$(() => {
          exportTab.value = 'json';
          isImporting.value = false;
          isExportOpen.value = true;
        })}
        onDownloadPdf={handleDownloadPDF}
      />
      <ExportPanel
        state={state}
        history={history}
        isOpen={isExportOpen.value}
        activeTab={exportTab}
        isImporting={isImporting}
        onClose={$(() => {
          isExportOpen.value = false;
        })}
        onImported={handleImported}
      />

      {/* Import success toast (also announced to assistive tech) */}
      {importToast.value && (
        <div
          class="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full shadow-lg text-sm font-medium"
          style={{ background: '#15803d', color: '#ffffff' }}
          role="status"
          aria-live="polite"
        >
          {importToast.value}
        </div>
      )}

      {/* Main Layout: Editor + Preview */}
      <div class="max-w-screen-2xl mx-auto flex flex-col lg:flex-row no-print">
        {/* Editor Panel */}
        <aside
          class="editor-panel w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 overflow-y-auto lg:h-[calc(100vh-57px)] p-4 space-y-4"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="Editor panel"
          onFocusin$={rememberSection}
        >
          {/* First-run coachmarks — introduces the workspace without blocking */}
          {showCoachmark.value && (
            <div
              class="editor-section"
              style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}
              role="region"
              aria-label="Getting started"
            >
              <h2 class="text-base font-semibold mb-2" style={{ color: '#4c1d95' }}>
                Welcome to PortfolioFrame
              </h2>
              <ul class="text-sm space-y-1 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                <li>• Build in the <strong>editor panel</strong> — every change updates the live preview instantly.</li>
                <li>• Watch the assembled document take shape in the <strong>preview canvas</strong> on the right.</li>
                <li>• The <strong>Completeness panel</strong> tracks which recommended fields are filled.</li>
                <li>• Press <strong>Ctrl+K</strong> (Cmd+K on Mac) for the command palette.</li>
              </ul>
              <button type="button" class="btn-primary text-sm" onClick$={dismissCoachmark}>
                Got it — start building
              </button>
            </div>
          )}

          {/* Undo/Redo + History */}
          <UndoRedo history={history} state={state} />
          <HistoryPanel history={history} state={state} />

          {/* Layout presets, Theme & Density */}
          <LayoutPresets state={state} history={history} />
          <ThemePicker state={state} history={history} />
          <DensityToggle state={state} history={history} />

          {/* Section Controls */}
          <SectionToggles state={state} history={history} />
          <SectionReorder state={state} history={history} />

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
        <main class="flex-1 min-w-0 p-4 lg:p-6 lg:h-[calc(100vh-57px)] lg:overflow-y-auto" aria-label="Live preview">
          {showCoachmark.value && (
            <p class="mx-auto text-sm mb-3" style={{ maxWidth: '800px', color: 'var(--color-text-muted)' }}>
              Live preview — this assembled document updates as you type and rearrange in the editor.
            </p>
          )}
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
