import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { scenesStore } from '@/store';
import { isSidebarOpenStore, toastDemoOnly } from '@/store/ui';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

const SIBLINGS = ['2. Create Your First Storyboard', '3. Storyboard Like a Pro'];

function SidebarContent() {
  const scenes = useStore(scenesStore);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Storyboards
        </p>
        <nav className="space-y-1" aria-label="Storyboards">
          <button
            type="button"
            onClick={() => toastDemoOnly('1. Getting Started')}
            className="flex w-full items-center gap-2.5 rounded-xl bg-yellow-50 px-3 py-2.5 text-left text-sm font-semibold text-yellow-900 ring-1 ring-inset ring-yellow-200/70 transition-colors hover:bg-yellow-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            aria-current="page"
          >
            <Ri name="book-2-line" size={17} className="shrink-0 text-yellow-600" />
            <span className="min-w-0 flex-1 truncate">1. Getting Started</span>
            <span className="shrink-0 rounded-full bg-yellow-400/90 px-2 py-0.5 text-[11px] font-bold text-yellow-950">
              {scenes.length}
            </span>
          </button>
          {SIBLINGS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toastDemoOnly(name)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="book-2-line" size={17} className="shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="shrink-0 text-[11px] font-semibold text-gray-400">8</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 px-1">
          <button
            type="button"
            onClick={() => toastDemoOnly('Add Storyboard')}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="add-line" size={17} />
            Add Storyboard
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={() => toastDemoOnly('Help')}
          className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <Ri name="question-line" size={18} />
          Help
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const mobileOpen = useStore(isSidebarOpenStore);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(mobileOpen, () => isSidebarOpenStore.set(false), panelRef);

  return (
    <>
      {/* Desktop: static rail beside the grid */}
      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-64 border-r border-gray-200/80 bg-[#fafaf8] lg:block">
        <SidebarContent />
      </aside>

      {/* ≤1024px: collapses behind the header toggle, opens as an overlay drawer */}
      <div
        className={clsx('fixed inset-0 z-40 lg:hidden', !mobileOpen && 'pointer-events-none')}
        aria-hidden={!mobileOpen}
      >
        <div
          className={clsx(
            'absolute inset-0 bg-gray-900/40 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => isSidebarOpenStore.set(false)}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Storyboard sidebar"
          tabIndex={-1}
          className={clsx(
            'absolute bottom-0 left-0 top-0 w-[19rem] max-w-[85vw] bg-[#fafaf8] shadow-2xl',
            mobileOpen ? 'panel-open translate-x-0' : 'panel-closed -translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200/80 px-4">
            <span className="text-sm font-bold tracking-tight text-gray-900">Storyboards</span>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => isSidebarOpenStore.set(false)}
              className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="close-line" size={20} />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <SidebarContent />
          </div>
        </div>
      </div>
    </>
  );
}
