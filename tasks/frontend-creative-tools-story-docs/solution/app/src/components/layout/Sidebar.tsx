import React from 'react';
import { showToast } from '@/store/ui';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50/50 fixed left-0 top-14 bottom-0 flex flex-col z-20 hidden lg:flex">
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-yellow-50 text-yellow-900 inert-nav focus:ring-2 focus:ring-yellow-400" onClick={() => showToast('1. Getting Started — demo only')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                1. Getting Started
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 inert-nav focus:ring-2 focus:ring-yellow-400" onClick={() => showToast('2. Create Your First Storyboard — demo only')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                2. Create Your First Storyboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 inert-nav focus:ring-2 focus:ring-yellow-400" onClick={() => showToast('3. Storyboard Like a Pro — demo only')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                3. Storyboard Like a Pro
            </button>
        </nav>

        <div className="px-5 mt-6">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 inert-nav focus:ring-2 focus:ring-yellow-400" onClick={() => showToast('Add Storyboard — demo only')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                Add Storyboard
            </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 inert-nav focus:ring-2 focus:ring-yellow-400 p-2 rounded w-full" onClick={() => showToast('Help — demo only')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            Help
        </button>
      </div>
    </aside>
  );
}
