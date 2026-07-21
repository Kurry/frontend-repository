import { useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { scenesStore, restoreVersion, type SceneVersion } from '@/store';
import { versionHistorySceneIdStore, showToast } from '@/store/ui';
import { diffLines, formatVersionTimestamp } from '@/lib/diff';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

function DiffView({ selected, current }: { selected: SceneVersion; current: SceneVersion }) {
  const bodyDiff = useMemo(() => diffLines(current.body, selected.body), [current.body, selected.body]);
  const titleDiff = useMemo(() => diffLines(current.title, selected.title), [current.title, selected.title]);
  const statusDiff = useMemo(() => diffLines(current.status, selected.status), [current.status, selected.status]);
  const cameraDiff = useMemo(
    () => diffLines(current.cameraNote ?? '', selected.cameraNote ?? ''),
    [current.cameraNote, selected.cameraNote]
  );

  const hasDifferences =
    bodyDiff.some((p) => p.type !== 'same') ||
    titleDiff.some((p) => p.type !== 'same') ||
    statusDiff.some((p) => p.type !== 'same') ||
    cameraDiff.some((p) => p.type !== 'same');

  if (!hasDifferences) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
        <Ri name="check-line" size={14} />
        No differences — this version matches the current scene.
      </p>
    );
  }

  const renderField = (label: string, parts: ReturnType<typeof diffLines>) => {
    if (!parts.some((p) => p.type !== 'same')) return null;
    return (
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 font-mono text-[11.5px] leading-relaxed">
          {parts.map((p, i) => (
            <div
              key={i}
              className={clsx(
                'whitespace-pre-wrap px-2.5 py-0.5',
                p.type === 'del' && 'bg-red-50 text-red-700',
                p.type === 'add' && 'bg-green-50 text-green-800',
                p.type === 'same' && 'text-gray-500'
              )}
            >
              <span className="mr-2 select-none font-bold" aria-hidden="true">
                {p.type === 'del' ? '−' : p.type === 'add' ? '+' : ' '}
              </span>
              {p.text === '' ? ' ' : p.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderField('Title', titleDiff)}
      {renderField('Description', bodyDiff)}
      {renderField('Camera note', cameraDiff)}
      {renderField('Status', statusDiff)}
      <p className="flex items-center gap-3 text-[10px] font-semibold text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-100 ring-1 ring-inset ring-green-300" />
          + in selected version
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-inset ring-red-300" />
          − only in current
        </span>
      </p>
    </div>
  );
}

/** Workspace-level Version history drawer for the targeted scene. */
export function VersionHistoryPanel() {
  const sceneId = useStore(versionHistorySceneIdStore);
  const scenes = useStore(scenesStore);
  const scene = scenes.find((s) => s.id === sceneId);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = sceneId !== null && !!scene;
  const close = () => {
    versionHistorySceneIdStore.set(null);
    setSelectedVersionId(null);
  };
  useDialogFocus(open, close, panelRef, { initialFocus: closeRef });

  if (!open || !scene) return null;

  const versions = scene.versions; // newest first
  const current = versions[0];
  const selected = versions.find((v) => v.id === selectedVersionId) ?? null;
  const isCurrentSelected = !selected || selected.id === current.id;

  const handleRestore = (version: SceneVersion) => {
    const number = versions.length - versions.findIndex((v) => v.id === version.id);
    restoreVersion(scene.id, version.id);
    showToast(`Version ${number} Restored`);
    setSelectedVersionId(null);
  };

  return (
    <div className="fixed inset-0 z-[65] overflow-hidden" aria-hidden={!open}>
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity duration-300" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Version history for ${scene.title}`}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200/70">
              <Ri name="history-line" size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-gray-900">Version History</h2>
              <p className="truncate text-xs text-gray-500">{scene.title}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close version history"
            onClick={close}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="close-line" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafaf8] p-4">
          {versions.map((v, idx) => {
            const number = versions.length - idx;
            const isCurrent = idx === 0;
            const isSelected = selected?.id === v.id;
            return (
              <div
                key={v.id}
                className={clsx(
                  'rounded-xl border bg-white p-3.5 transition-colors',
                  isSelected ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedVersionId(isSelected ? null : v.id)}
                  aria-expanded={isSelected}
                  className="flex w-full items-center justify-between gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    Version {number}
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500">
                    {formatVersionTimestamp(v.timestamp)}
                  </span>
                </button>

                {isSelected && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    {isCurrent ? (
                      <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
                        <Ri name="check-line" size={14} />
                        This is the current version — nothing to compare or restore.
                      </p>
                    ) : (
                      <>
                        <p className="mb-2 text-[11px] font-semibold text-gray-400">
                          Comparing version {number} with the current scene
                        </p>
                        <DiffView selected={v} current={current} />
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRestore(v)}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-yellow-400 px-4 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                          >
                            <Ri name="arrow-go-back-line" size={15} />
                            Restore Version {number}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {versions.length === 1 && (
            <p className="px-1 text-xs text-gray-400">
              This scene has one version. Committed edits and restores append new timestamped versions here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
