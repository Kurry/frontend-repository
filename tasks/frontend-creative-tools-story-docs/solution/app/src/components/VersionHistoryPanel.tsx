import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { scenesStore, updateScene } from '../store';

interface Props {
  sceneId: string;
  onClose: () => void;
}

export function VersionHistoryPanel({ sceneId, onClose }: Props) {
  const scenes = useStore(scenesStore);
  const scene = scenes.find(s => s.id === sceneId);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus management for dialog
    if (panelRef.current) {
      panelRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        // Return focus logic would ideally target the button that opened it,
        // but for now we focus document body
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scene) return null;

  const history = scene.history || [];

  const handleRestore = (version: any) => {
    updateScene(scene.id, {
      title: version.title,
      body: version.body,
      cameraNote: version.cameraNote,
      status: version.status
    });
    onClose();
  };

  // Very simple text diffing for demonstration
  const renderDiff = (currentText: string, pastText: string) => {
    if (currentText === pastText) {
      return <div className="text-gray-600">{pastText}</div>;
    }

    // Very basic diff representation
    return (
      <div className="font-mono text-sm space-y-1 mt-2">
        <div className="text-red-700 bg-red-50 p-1 border-l-2 border-red-500 line-through opacity-70">
          <span className="font-bold mr-2 select-none">-</span>
          {pastText}
        </div>
        <div className="text-green-700 bg-green-50 p-1 border-l-2 border-green-500">
          <span className="font-bold mr-2 select-none">+</span>
          {currentText}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-stretch justify-end">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-96 bg-white shadow-xl flex flex-col focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Version history"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold">Version History</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close version history">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {history.length === 0 ? (
            <div className="text-gray-500 italic text-center mt-8">No version history available.</div>
          ) : (
            history.map((version, index) => {
              const isCurrent = index === 0;
              const date = new Date(version.timestamp);

              return (
                <div key={version.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm relative">
                  <div className="text-xs text-gray-500 mb-2 font-mono bg-gray-100 p-1 rounded inline-block">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{version.title}</h3>
                    {isCurrent ? (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Current</span>
                    ) : (
                      <button
                        ref={index === 1 ? restoreBtnRef : null}
                        className="btn btn-xs btn-outline"
                        onClick={() => handleRestore(version)}
                      >
                        Restore
                      </button>
                    )}
                  </div>

                  {isCurrent || history.length === 1 ? (
                    <div className="text-sm text-gray-600 line-clamp-3 mt-2">{version.body}</div>
                  ) : (
                    <div className="mt-2 text-sm">
                      {renderDiff(scene.body, version.body)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
