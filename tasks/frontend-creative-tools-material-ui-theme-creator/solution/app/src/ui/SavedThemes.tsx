import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, type NamePanelState } from '../store';
import { Icon, hasOpenModalOverlay } from './primitives';

function makeNameSchema(existing: string[]) {
  return z.object({
    name: z
      .string({ required_error: 'name is required' })
      .trim()
      .min(1, 'name is required')
      .max(64, 'name must be at most 64 characters')
      .refine((v) => !existing.includes(v.trim()), { message: 'name must be unique among saved themes' })
  });
}
type NameForm = { name: string };

const PANEL_TITLES: Record<NamePanelState['mode'], { title: string; submit: string }> = {
  new: { title: 'New Theme', submit: 'Create Theme' },
  rename: { title: 'Rename Theme', submit: 'Save Name' },
  snapshot: { title: 'Save Snapshot', submit: 'Save Snapshot' }
};

/**
 * Non-modal New Theme / Rename / Snapshot panel. It lives at the app root and
 * keeps its state in the store, so it stays open across main-tab switches:
 * you can open New Theme, hop to Preview to tweak a palette color, come back
 * to Saved Themes, and submit — the two flows never corrupt each other.
 * Deliberately not aria-modal and not focus-trapped (the Tutorial, Theme
 * Files, and Command palette are the modal overlays).
 */
export function NamePanel() {
  const panel = useStore((s) => s.namePanel);
  const setPanel = useStore((s) => s.setNamePanel);
  const savedThemes = useStore((s) => s.savedThemes);
  const createTheme = useStore((s) => s.createTheme);
  const renameTheme = useStore((s) => s.renameTheme);
  const saveSnapshot = useStore((s) => s.saveSnapshot);
  const announce = useStore((s) => s.announce);

  const mode = panel?.mode ?? 'new';
  const renameTarget = savedThemes.find((t) => t.id === panel?.themeId);
  const existing = useMemo(() => {
    if (mode === 'rename') return savedThemes.filter((t) => t.id !== panel?.themeId).map((t) => t.name);
    if (mode === 'snapshot') return [];
    return savedThemes.map((t) => t.name);
  }, [savedThemes, mode, panel?.themeId]);

  const schema = useMemo(() => makeNameSchema(existing), [existing]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isValid, isSubmitting }
  } = useForm<NameForm>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { name: '' } });

  useEffect(() => {
    if (panel) {
      reset({ name: panel.mode === 'rename' ? renameTarget?.name ?? '' : '' });
      const t = setTimeout(() => setFocus('name', { shouldSelect: true }), 60);
      return () => clearTimeout(t);
    }
  }, [panel, reset, setFocus, renameTarget?.name]);

  // Announce validation feedback through the assertive live region as soon as
  // it appears visually — except when a failed store action (createTheme,
  // renameTheme, saveSnapshot) already announced this exact message, so
  // assistive tech hears each failure once, not twice.
  const errorMessage = errors.name?.message;
  const storeAnnouncedError = useRef<string | null>(null);
  useEffect(() => {
    if (!errorMessage) return;
    const duplicate = storeAnnouncedError.current === errorMessage;
    storeAnnouncedError.current = null;
    if (!duplicate) announce(errorMessage);
  }, [errorMessage, announce]);

  useEffect(() => {
    if (!panel) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // The panel sits below the modal layer (z-40 vs z-50): while a modal is
      // open, Escape belongs to the topmost modal, not to this panel.
      if (hasOpenModalOverlay()) return;
      e.stopPropagation();
      setPanel(null);
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [panel, setPanel]);

  const labels = PANEL_TITLES[mode];
  const titleId = `name-panel-title-${mode}`;

  const submit = handleSubmit((data) => {
    const name = data.name.trim();
    let res: { ok: boolean; error?: string };
    if (mode === 'rename') {
      // Never fall through to createTheme from rename mode: if the target id
      // is gone, surface an error instead of silently creating a new theme.
      res = panel?.themeId
        ? renameTheme(panel.themeId, name)
        : { ok: false, error: 'That theme no longer exists' };
    } else if (mode === 'snapshot') res = saveSnapshot(name);
    else res = createTheme(name);
    if (!res.ok) {
      const msg = res.error ?? 'Invalid name';
      storeAnnouncedError.current = msg;
      setError('name', { message: msg });
      return;
    }
    setPanel(null);
  });

  return (
    <AnimatePresence>
      {panel && (
        <motion.div
          key={mode + (panel.themeId ?? '')}
          role="dialog"
          aria-labelledby={titleId}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="fixed z-40 left-4 top-28 bg-shell-1 border border-shell-border rounded-xl shadow-2xl"
          style={{ width: 'min(380px, calc(100vw - 2rem))' }}
          data-testid="name-panel"
        >
          <form onSubmit={submit} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name={mode === 'snapshot' ? 'photo_camera' : mode === 'rename' ? 'edit' : 'add_circle'} className="text-accent" style={{ fontSize: 20 }} />
              <h2 id={titleId} className="text-base font-semibold">
                {labels.title}
              </h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label={`Close ${labels.title}`}
                className="lift ml-auto bg-shell-2 rounded p-1"
              >
                <Icon name="close" style={{ fontSize: 16 }} />
              </button>
            </div>
            <label htmlFor="name-field" className="text-xs text-shell-muted">
              Theme Name
            </label>
            <input
              id="name-field"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
              className="w-full mt-1 bg-shell-2 text-shell-text px-3 py-2 rounded-md border border-shell-border text-sm"
            />
            <div id="name-error" className="min-h-[18px] mt-1">
              {errors.name && (
                <span className="text-xs text-red-300" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>
            <p className="text-[11px] text-shell-muted mb-3">
              The panel stays open while you switch tabs — adjust the theme in Preview, then submit here.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="lift bg-shell-2 hover:bg-shell-3 text-shell-text px-4 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="lift bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent"
              >
                {labels.submit}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SavedThemes() {
  const savedThemes = useStore((s) => s.savedThemes);
  const activeThemeId = useStore((s) => s.activeThemeId);
  const deleteTheme = useStore((s) => s.deleteTheme);
  const loadTheme = useStore((s) => s.loadTheme);
  const restoreSnapshot = useStore((s) => s.restoreSnapshot);
  const setNamePanel = useStore((s) => s.setNamePanel);

  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => savedThemes.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())),
    [savedThemes, search]
  );
  const active = savedThemes.find((t) => t.id === activeThemeId);

  return (
    <section aria-label="Saved Themes" className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold flex-1">Saved Themes</h2>
        <div className="flex items-center gap-2 bg-shell-1 rounded-md px-2 py-1.5 border border-shell-border">
          <Icon name="search" style={{ fontSize: 16 }} className="text-shell-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search saved themes"
            className="bg-transparent text-xs text-shell-text outline-none w-36"
          />
        </div>
        {active && (
          <button
            type="button"
            onClick={() => setNamePanel({ mode: 'snapshot' })}
            className="lift bg-shell-2 hover:bg-shell-3 text-shell-text px-3 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <Icon name="photo_camera" style={{ fontSize: 16 }} />
            Snapshot
          </button>
        )}
        <button
          type="button"
          onClick={() => setNamePanel({ mode: 'new' })}
          className="lift bg-accent hover:bg-accent-strong text-white px-3 py-2 rounded-md text-sm flex items-center gap-1"
        >
          <Icon name="add" style={{ fontSize: 16 }} />
          New Theme
        </button>
      </div>

      <p className="text-xs text-shell-muted mb-3" data-testid="saved-count">
        {filtered.length} of {savedThemes.length} themes
      </p>

      {savedThemes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-shell-border rounded-xl bg-shell-1">
          <Icon name="palette" style={{ fontSize: 40 }} className="text-shell-muted" />
          <h3 className="text-base font-medium mt-2">No Saved Themes Yet</h3>
          <p className="text-sm text-shell-muted mt-1">
            This region holds your saved themes. Create your first one with New Theme to save the current palette,
            typography, and shape.
          </p>
          <button
            type="button"
            onClick={() => setNamePanel({ mode: 'new' })}
            className="lift bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-md text-sm mt-4"
          >
            New Theme
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-shell-border rounded-xl bg-shell-1">
          <h3 className="text-base font-medium">No Matches</h3>
          <p className="text-sm text-shell-muted mt-1">No saved theme matches “{search}”. Clear the search to see all themes.</p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="lift bg-shell-2 hover:bg-shell-3 text-shell-text px-4 py-2 rounded-md text-sm mt-4"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -6, transition: { duration: 0.24 } }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`row-wash bg-shell-1 rounded-xl border p-3 ${activeThemeId === t.id ? 'border-accent' : 'border-shell-border'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex gap-1 mt-1">
                    {(['primary', 'secondary', 'error', 'success'] as const).map((k) => (
                      <span key={k} className="w-4 h-4 rounded-full border border-shell-border" style={{ backgroundColor: t.themeOptions.palette[k].main }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{t.name}</h3>
                    <p className="text-xs text-shell-muted capitalize">
                      {t.paletteType} · radius {t.themeOptions.shape.borderRadius}
                      {activeThemeId === t.id ? ' · loaded' : ''}
                    </p>
                    {t.snapshots.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.snapshots.map((sn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => restoreSnapshot(i)}
                            disabled={activeThemeId !== t.id}
                            aria-label={`Restore snapshot ${sn.name}`}
                            className="inert-link text-[11px] bg-shell-2 px-1.5 py-0.5 rounded border border-shell-border disabled:opacity-40"
                          >
                            {sn.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => loadTheme(t.id)}
                    className="lift bg-accent hover:bg-accent-strong text-white text-xs px-2.5 py-1.5 rounded flex-1"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setNamePanel({ mode: 'rename', themeId: t.id })}
                    aria-label={`Rename ${t.name}`}
                    className="lift bg-shell-2 hover:bg-shell-3 text-shell-text text-xs px-2.5 py-1.5 rounded"
                  >
                    <Icon name="edit" style={{ fontSize: 15 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTheme(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="lift bg-shell-2 hover:bg-shell-3 text-red-300 text-xs px-2.5 py-1.5 rounded"
                  >
                    <Icon name="delete" style={{ fontSize: 15 }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
