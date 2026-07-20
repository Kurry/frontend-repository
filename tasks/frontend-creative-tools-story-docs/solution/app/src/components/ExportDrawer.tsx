import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { scenesStore, Scene } from '../store';
import { extractHeadings } from '../utils/markdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDrawer({ isOpen, onClose }: Props) {
  const scenes = useStore(scenesStore);
  const [activeTab, setActiveTab] = useState<'markdown' | 'json' | 'outline'>('markdown');
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus management for dialog
      if (drawerRef.current) {
        drawerRef.current.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    return scenes.map(scene => {
      let md = `## ${scene.order}. ${scene.title}\n\n`;
      md += `${scene.body}\n`;
      if (scene.cameraNote) md += `\n> 🎥 ${scene.cameraNote}\n`;
      return md;
    }).join('\n---\n\n');
  };

  const generateJson = () => {
    const pkg = {
      version: '1.0',
      type: 'StoryboardPackage',
      scenes: scenes.map(({ id, history, canvasX, canvasY, ...rest }) => rest)
    };
    return JSON.stringify(pkg, null, 2);
  };

  const generateOutline = () => {
    return scenes.map(scene => {
      let outline = `${scene.order}. ${scene.title} [${scene.status.toUpperCase()}]\n`;
      const headings = extractHeadings(scene.body);
      if (headings.length > 0) {
        outline += headings.map(h => `   - ${h}`).join('\n') + '\n';
      }
      return outline;
    }).join('\n');
  };

  const content = activeTab === 'markdown'
    ? generateMarkdown()
    : activeTab === 'json'
      ? generateJson()
      : generateOutline();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-[500px] max-w-full bg-white h-full shadow-2xl flex flex-col focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Export Storyboard"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">Export Storyboard</h2>
          <button
            ref={firstFocusableRef}
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="Close export drawer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="tabs tabs-boxed mb-4 bg-gray-100">
            <button
              className={`tab ${activeTab === 'markdown' ? 'tab-active bg-white shadow-sm' : ''}`}
              onClick={() => setActiveTab('markdown')}
            >
              Markdown
            </button>
            <button
              className={`tab ${activeTab === 'json' ? 'tab-active bg-white shadow-sm' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              JSON
            </button>
            <button
              className={`tab ${activeTab === 'outline' ? 'tab-active bg-white shadow-sm' : ''}`}
              onClick={() => setActiveTab('outline')}
            >
              Outline
            </button>
          </div>

          <div className="flex-1 min-h-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <textarea
              readOnly
              value={content}
              className="w-full h-full p-4 font-mono text-sm resize-none bg-transparent outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label={`Export preview as ${activeTab}`}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(content).catch(() => {});
                if (window.showToast) window.showToast('Copied to clipboard');
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
