import React from 'react';
import { useStore } from '@nanostores/react';
import { viewModeStore, scenesStore, statusFilterStore, searchFilterStore, injectTemplate, undo, redo, resetCanvasPositions } from '@/store';
import { isExportDrawerOpenStore, isCommandPaletteOpenStore, isImportModalOpenStore } from '@/store/ui';
import { clsx } from 'clsx';
import { showToast } from '@/store/ui';

export function StoryboardNav() {
  const viewMode = useStore(viewModeStore);
  const statusFilter = useStore(statusFilterStore);
  const searchFilter = useStore(searchFilterStore);
  const scenes = useStore(scenesStore);

  const handleTemplateInject = (type: string) => {
    if (type === 'feature') {
      injectTemplate([
        { title: 'Feature Overview', body: 'Introduce the new feature.', status: 'draft' },
        { title: 'Key Benefits', body: 'Highlight what users gain.', status: 'draft' },
        { title: 'How to Use', body: 'Step-by-step guide.', status: 'draft' }
      ]);
      showToast('Injected Feature Walkthrough (3 scenes)');
    } else {
      injectTemplate([
        { title: 'Announcement', body: 'We are thrilled to announce...', status: 'draft' },
        { title: 'Changes', body: 'What has changed.', status: 'draft' },
        { title: 'Rollout', body: 'When to expect it.', status: 'draft' }
      ]);
      showToast('Injected Release Announcement (3 scenes)');
    }
  };

  return (
    <nav className="flex items-center gap-2 mb-6 storyboard-nav sticky top-14 bg-white z-10 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-gray-100 flex-wrap" aria-label="Storyboard View Options">
      <div className="flex-1 flex gap-2 items-center flex-wrap">
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
            id="status-filter"
            className="select select-sm select-bordered w-32 focus:ring-2 focus:ring-yellow-400"
            value={statusFilter}
            onChange={(e) => statusFilterStore.set(e.target.value as any)}
        >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="ready">Ready</option>
        </select>
        <div className="relative">
            <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <label htmlFor="search-scenes" className="sr-only">Search scenes</label>
            <input
                id="search-scenes"
                type="text"
                placeholder="Search scenes..."
                className="input input-sm input-bordered pl-8 w-48 focus:ring-2 focus:ring-yellow-400"
                value={searchFilter}
                onChange={(e) => searchFilterStore.set(e.target.value)}
            />
        </div>

        <div className="dropdown dropdown-bottom">
          <button tabIndex={0} className="btn btn-sm btn-outline m-1 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400" aria-haspopup="true">Templates</button>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-gray-100" role="menu">
            <li role="menuitem"><button onClick={() => handleTemplateInject('feature')}>Feature Walkthrough <span className="text-xs text-gray-400 ml-auto">3 scenes</span></button></li>
            <li role="menuitem"><button onClick={() => handleTemplateInject('release')}>Release Announcement <span className="text-xs text-gray-400 ml-auto">3 scenes</span></button></li>
          </ul>
        </div>

        {viewMode === 'canvas' && (
            <button className="btn btn-sm btn-outline hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400" onClick={() => resetCanvasPositions()}>
                Reset layout
            </button>
        )}
      </div>

      <div className="flex items-center gap-2 mr-4 flex-wrap">
        <button className="btn btn-sm btn-ghost px-2 hover:bg-gray-100" onClick={undo} aria-label="Undo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button className="btn btn-sm btn-ghost px-2 hover:bg-gray-100" onClick={redo} aria-label="Redo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>

        <button className="btn btn-sm btn-outline text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400" onClick={() => isImportModalOpenStore.set(true)}>Import</button>
        <button className="btn btn-sm btn-outline text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-400" onClick={() => isExportDrawerOpenStore.set(true)}>Export</button>
      </div>

      <div className="flex items-center bg-gray-100 p-1 rounded-lg" role="group" aria-label="View Modes">
        <button
          className={clsx("p-1.5 rounded-md transition-all focus:ring-2 focus:ring-yellow-400", viewMode === 'tile' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900")}
          onClick={() => { viewModeStore.set('tile'); showToast('Tile mode'); }}
          aria-pressed={viewMode === 'tile'}
          aria-label="Tile mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-tiles" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </button>
        <button
          className={clsx("p-1.5 rounded-md transition-all focus:ring-2 focus:ring-yellow-400", viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900")}
          onClick={() => { viewModeStore.set('list'); showToast('List mode'); }}
          aria-pressed={viewMode === 'list'}
          aria-label="List mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-list" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </button>
        <button
          className={clsx("p-1.5 rounded-md transition-all focus:ring-2 focus:ring-yellow-400", viewMode === 'slide' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900")}
          onClick={() => { viewModeStore.set('slide'); showToast('Slide mode'); }}
          aria-pressed={viewMode === 'slide'}
          aria-label="Slide mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-slides" aria-hidden="true"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 11h18"/></svg>
        </button>
        <button
          className={clsx("p-1.5 rounded-md transition-all focus:ring-2 focus:ring-yellow-400", viewMode === 'canvas' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900")}
          onClick={() => { viewModeStore.set('canvas'); showToast('Canvas mode'); }}
          aria-pressed={viewMode === 'canvas'}
          aria-label="Canvas mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-canvas" aria-hidden="true"><path d="M5 3v18"/><path d="M19 3v18"/><path d="M3 5h18"/><path d="M3 19h18"/></svg>
        </button>
      </div>
    </nav>
  );
}
