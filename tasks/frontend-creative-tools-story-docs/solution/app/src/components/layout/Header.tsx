import { useStore } from '@nanostores/react';
import {
  isNotificationsDrawerOpenStore,
  isAccountDrawerOpenStore,
  isSidebarOpenStore,
  toastDemoOnly,
} from '@/store/ui';
import { KebabMenu } from '../common/KebabMenu';
import { Ri } from '../common/Ri';

export function Header() {
  const sidebarOpen = useStore(isSidebarOpenStore);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-1.5 px-3 sm:gap-2 sm:px-5">
        {/* Mobile sidebar toggle — full 44px tap target */}
        <button
          type="button"
          aria-label={sidebarOpen ? 'Close storyboard sidebar' : 'Open storyboard sidebar'}
          aria-expanded={sidebarOpen}
          onClick={() => isSidebarOpenStore.set(!sidebarOpen)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 lg:hidden"
        >
          <Ri name="menu-line" size={22} />
        </button>

        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-400 text-gray-900 shadow-sm shadow-yellow-400/40">
            <Ri name="film-line" size={22} />
          </span>
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => toastDemoOnly('Demo Projects')}
              className="shrink-0 rounded-md text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              Demo Projects
            </button>
            <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden="true" />
            <h1 className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-lg">
              1. Getting Started
            </h1>
            <KebabMenu
              label="Storyboard Options"
              menuClassName="left-0 right-auto"
              items={[
                { label: 'Rename storyboard', icon: 'pencil-line', onActivate: () => toastDemoOnly('Rename') },
                { label: 'Duplicate storyboard', icon: 'file-copy-line', onActivate: () => toastDemoOnly('Duplicate') },
                { label: 'Share storyboard', icon: 'upload-2-line', onActivate: () => toastDemoOnly('Share') },
              ]}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => isNotificationsDrawerOpenStore.set(true)}
            className="relative grid h-11 w-11 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="notification-3-line" size={21} />
            <span
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            aria-label="Dashboard"
            onClick={() => toastDemoOnly('Dashboard')}
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="dashboard-3-line" size={21} />
          </button>
          <button
            type="button"
            aria-label="Account"
            onClick={() => isAccountDrawerOpenStore.set(true)}
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="user-3-line" size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}
