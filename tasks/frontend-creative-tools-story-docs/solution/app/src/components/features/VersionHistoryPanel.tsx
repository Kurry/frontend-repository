import React, { useState } from 'react';
import { type Scene, restoreVersion } from '@/store';
import { showToast } from '@/store/ui';

interface VersionHistoryPanelProps {
    scene: Scene;
    onClose: () => void;
}

export function VersionHistoryPanel({ scene, onClose }: VersionHistoryPanelProps) {
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    const handleRestore = (versionId: string) => {
        restoreVersion(scene.id, versionId);
        showToast('Version restored');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 max-w-md w-full flex bg-white shadow-xl flex-col h-full animate-slide-in-right">
                <div className="px-4 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Version History</h2>
                    <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {scene.versions.map((v, idx) => (
                        <div
                            key={v.id}
                            className={`p-4 bg-white rounded-lg border cursor-pointer transition-colors ${selectedVersionId === v.id ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setSelectedVersionId(v.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') setSelectedVersionId(v.id);
                            }}
                            tabIndex={0}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">Version {scene.versions.length - idx}</span>
                                <span className="text-xs text-gray-500">{new Date(v.timestamp).toLocaleString()}</span>
                            </div>
                            {selectedVersionId === v.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-sm space-y-2 mb-4">
                                        {v.body !== scene.body ? (
                                            <>
                                                <div className="text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                                                    <span className="font-bold shrink-0 mt-0.5">-</span>
                                                    <del className="opacity-75">{scene.body}</del>
                                                </div>
                                                <div className="text-green-600 bg-green-50 p-2 rounded flex items-start gap-2">
                                                    <span className="font-bold shrink-0 mt-0.5">+</span>
                                                    <span>{v.body}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-500 italic p-2">No body differences</div>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            className="btn btn-sm btn-primary bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none"
                                            onClick={(e) => { e.stopPropagation(); handleRestore(v.id); }}
                                            disabled={v.id === scene.versions[0].id} // Disable restore for current version
                                        >
                                            Restore this version
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
