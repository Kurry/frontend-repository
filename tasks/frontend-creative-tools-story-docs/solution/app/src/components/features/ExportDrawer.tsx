import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { isExportDrawerOpenStore, showToast } from '@/store/ui';
import { scenesStore } from '@/store';
import { clsx } from 'clsx';

export function ExportDrawer() {
    const isOpen = useStore(isExportDrawerOpenStore);
    const scenes = useStore(scenesStore);
    const [activeTab, setActiveTab] = useState<'markdown' | 'json' | 'outline'>('markdown');
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) isExportDrawerOpenStore.set(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!isOpen) return null;

    const getMarkdown = () => {
        return scenes.map(s => {
            let md = `## ${s.order}. ${s.title}\nStatus: ${s.status}\n`;
            if (s.cameraNote) md += `Camera: ${s.cameraNote}\n`;
            md += `\n${s.body}\n`;
            return md;
        }).join('\n---\n\n');
    };

    const getJson = () => {
        const payload = {
            schemaVersion: 1,
            project: "Demo Projects",
            storyboard: "1. Getting Started",
            scenes: scenes.map(({ id, versions, canvasX, canvasY, ...s }) => s),
            generatedAt: new Date().toISOString()
        };
        return JSON.stringify(payload, null, 2);
    };

    const getOutline = () => {
        return scenes.map(s => `${s.order}. ${s.title} — ${s.status}`).join('\n');
    };

    const content = activeTab === 'markdown' ? getMarkdown() : activeTab === 'json' ? getJson() : getOutline();

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        showToast('Copied to clipboard');
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyboard.${activeTab === 'json' ? 'json' : activeTab === 'markdown' ? 'md' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={() => isExportDrawerOpenStore.set(false)}></div>
            <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex bg-white shadow-xl flex-col h-full animate-slide-in-right" ref={drawerRef}>
                <div className="px-4 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Export Storyboard</h2>
                    <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        onClick={() => isExportDrawerOpenStore.set(false)}
                    >
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex px-4" aria-label="Tabs">
                        {(['markdown', 'json', 'outline'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm capitalize",
                                    activeTab === tab
                                        ? "border-yellow-500 text-yellow-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <pre className="bg-white p-4 rounded-lg border border-gray-200 shadow-inner text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                        {content}
                    </pre>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
                    <button className="btn btn-outline" onClick={handleCopy}>Copy</button>
                    <button className="btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none" onClick={handleDownload}>Download</button>
                </div>
            </div>
        </div>
    );
}
