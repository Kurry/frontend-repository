import React from 'react';
import { isNotificationsDrawerOpenStore, isAccountDrawerOpenStore, showToast } from '@/store/ui';

export function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 fixed top-0 w-full z-30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-400"></div>
            <span className="font-semibold text-gray-700">Demo Projects</span>
        </div>
        <div className="h-4 w-px bg-gray-300"></div>
        <h1 className="font-semibold text-gray-900">1. Getting Started</h1>
        <button className="text-gray-500 hover:bg-gray-100 p-1 rounded transition-colors inert-nav focus:ring-2 focus:ring-yellow-400" aria-label="Storyboard Options" onClick={() => showToast('Storyboard Options — demo only')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors inert-nav focus:ring-2 focus:ring-yellow-400"
          aria-label="Notifications"
          onClick={() => isNotificationsDrawerOpenStore.set(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
        <button
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors inert-nav focus:ring-2 focus:ring-yellow-400"
          aria-label="Dashboard"
          onClick={() => showToast('Dashboard — demo only')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        </button>
        <button
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors inert-nav focus:ring-2 focus:ring-yellow-400"
          aria-label="Account"
          onClick={() => isAccountDrawerOpenStore.set(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        </button>
      </div>
    </header>
  );
}
