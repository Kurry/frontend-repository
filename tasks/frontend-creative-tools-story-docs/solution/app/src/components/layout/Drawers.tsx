import { useRef, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import {
  isNotificationsDrawerOpenStore,
  isAccountDrawerOpenStore,
  toastDemoOnly,
} from '@/store/ui';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

function Drawer({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(isOpen, onClose, panelRef, { initialFocus: closeRef });

  return (
    <div className={clsx('fixed inset-0 z-50 overflow-hidden', !isOpen && 'pointer-events-none')} aria-hidden={!isOpen}>
      <div
        className={clsx(
          'absolute inset-0 bg-gray-900/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={clsx(
          'absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl',
          isOpen ? 'panel-open translate-x-0' : 'panel-closed translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold tracking-tight text-gray-900">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={`Close ${title}`}
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="close-line" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

const NOTIFICATIONS = [
  { tone: 'bg-yellow-50 text-yellow-800 ring-yellow-200/70', title: 'Welcome to Story Docs!', meta: 'Your Getting Started storyboard is ready to edit.' },
  { tone: 'bg-gray-50 text-gray-700 ring-gray-200', title: 'New comment on “Meet the Header”', meta: 'Riley suggested tightening the second bullet.' },
  { tone: 'bg-gray-50 text-gray-700 ring-gray-200', title: '“Checklists” moved to review', meta: 'Status changed by Morgan, 2 hours ago.' },
];

export function NotificationsDrawer() {
  const isOpen = useStore(isNotificationsDrawerOpenStore);
  return (
    <Drawer isOpen={isOpen} onClose={() => isNotificationsDrawerOpenStore.set(false)} title="Notifications">
      <div className="space-y-3">
        {NOTIFICATIONS.map((n) => (
          <div key={n.title} className={clsx('rounded-xl p-3.5 ring-1 ring-inset', n.tone)}>
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="mt-0.5 text-xs opacity-80">{n.meta}</p>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

export function AccountDrawer() {
  const isOpen = useStore(isAccountDrawerOpenStore);
  return (
    <Drawer isOpen={isOpen} onClose={() => isAccountDrawerOpenStore.set(false)} title="Account">
      <div className="space-y-6">
        <div>
          <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Profile</p>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-800 ring-1 ring-inset ring-yellow-200">
              JD
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Jane Doe</p>
              <p className="text-xs text-gray-500">jane@demo-projects.app</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Tabs</p>
          {['Storyboards', 'Settings', 'Account'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toastDemoOnly(t)}
              className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              {t}
              <Ri name="arrow-right-s-line" size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => toastDemoOnly('Sign out')}
            className="h-11 rounded-xl px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Sign Out
          </button>
        </div>
      </div>
    </Drawer>
  );
}
