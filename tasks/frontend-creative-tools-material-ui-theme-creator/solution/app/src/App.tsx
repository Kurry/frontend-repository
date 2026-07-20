import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore, type MainTab } from './store';
import { Icon, Toasts, LiveRegions, ColorBlindFilters } from './ui/primitives';
import { PreviewPane } from './ui/PreviewPane';
import { EditorPane } from './ui/EditorPane';
import { ToolsPanel } from './ui/ToolsPanel';
import { ComponentsGallery } from './ui/ComponentsGallery';
import { SavedThemes } from './ui/SavedThemes';
import { ThemeFilesDrawer, ImportDialog } from './ui/ThemeFiles';
import { CommandPalette } from './ui/CommandPalette';
import { Tutorial } from './ui/Tutorial';

const TABS: Array<{ id: MainTab; label: string }> = [
  { id: 'preview', label: 'Preview' },
  { id: 'components', label: 'Components' },
  { id: 'saved', label: 'Saved Themes' }
];

function HeaderButton({ onClick, icon, label, text }: { onClick: () => void; icon: string; label: string; text?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="lift flex items-center gap-1.5 bg-shell-2 text-shell-text px-3 py-1.5 rounded-md text-sm">
      <Icon name={icon} style={{ fontSize: 18 }} />
      {text && <span className="hidden sm:inline">{text}</span>}
    </button>
  );
}

export default function App() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const setTutorialOpen = useStore((s) => s.setTutorialOpen);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const setImportOpen = useStore((s) => s.setImportOpen);
  const commandOpen = useStore((s) => s.commandOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!useStore.getState().commandOpen);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandOpen]);

  return (
    <div className="min-h-full flex flex-col overflow-x-hidden">
      <ColorBlindFilters />
      <LiveRegions />

      {/* Header */}
      <header className="border-b border-shell-border bg-shell-1">
        <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Icon name="palette" className="text-white" style={{ fontSize: 20 }} />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">Material-UI Theme Creator</h1>
              <span className="inert-link text-[11px] text-shell-muted font-mono" role="note" aria-label="Package version">
                @material-ui/core@^4.11.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button type="button" onClick={() => setCommandOpen(true)} className="lift hidden sm:flex items-center gap-2 bg-shell-2 text-shell-muted px-3 py-1.5 rounded-md text-xs">
              <Icon name="search" style={{ fontSize: 16 }} />
              Command Palette
              <kbd className="text-[10px] border border-shell-border rounded px-1">⌘K</kbd>
            </button>
            <HeaderButton onClick={() => setImportOpen(true)} icon="upload" label="Import Theme" text="Import" />
            <HeaderButton onClick={() => setExportOpen(true)} icon="download" label="Export Theme Files" text="Export" />
            <HeaderButton onClick={() => setTutorialOpen(true)} icon="school" label="Open Tutorial" text="Tutorial" />
            <button type="button" onClick={(e) => e.preventDefault()} aria-label="GitHub repository" className="inert-link lift bg-shell-2 p-1.5 rounded-md">
              <Icon name="code" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <nav className="px-4 flex gap-1" role="tablist" aria-label="Main workspace">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3 py-2 text-sm transition-colors ${tab === t.id ? 'text-shell-text' : 'text-shell-muted hover:text-shell-text'}`}
            >
              {t.label}
              {tab === t.id && (
                <motion.span layoutId="tab-indicator" className="absolute left-2 right-2 -bottom-px h-0.5 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Workspace — Preview stays mounted (hidden when inactive) so Monaco is
          never disposed mid-session, which otherwise logs a benign "Canceled" error. */}
      <main className="flex-1 p-4 min-w-0">
        <div className={tab === 'preview' ? 'grid grid-cols-1 gap-4 min-[1025px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : 'hidden'}>
          <PreviewPane />
          <div className="flex flex-col gap-3 min-w-0">
            <EditorPane />
            <ToolsPanel />
          </div>
        </div>
        {tab === 'components' && <ComponentsGallery />}
        {tab === 'saved' && <SavedThemes />}
      </main>

      <ThemeFilesDrawer />
      <ImportDialog />
      <CommandPalette />
      <Tutorial />
      <Toasts />
    </div>
  );
}
