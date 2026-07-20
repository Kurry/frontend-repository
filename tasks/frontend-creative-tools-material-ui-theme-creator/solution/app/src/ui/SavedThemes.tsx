import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../store';
import { Icon, Modal } from './primitives';

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

function NameDialog({
  open,
  title,
  submitLabel,
  existing,
  initial,
  onClose,
  onSubmit
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  existing: string[];
  initial?: string;
  onClose: () => void;
  onSubmit: (name: string) => { ok: boolean; error?: string; field?: string };
}) {
  const schema = useMemo(() => makeNameSchema(existing), [existing]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting }
  } = useForm<NameForm>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { name: initial ?? '' } });

  React.useEffect(() => {
    if (open) reset({ name: initial ?? '' });
  }, [open, initial, reset]);

  const submit = handleSubmit((data) => {
    const res = onSubmit(data.name.trim());
    if (!res.ok) {
      setError('name', { message: res.error ?? 'Invalid name' });
      return;
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} labelledBy="name-dialog-title" width={440}>
      <form onSubmit={submit} className="p-5">
        <h2 id="name-dialog-title" className="text-lg font-semibold mb-3">
          {title}
        </h2>
        <label htmlFor="name-field" className="text-xs text-shell-muted">
          Theme Name
        </label>
        <input
          id="name-field"
          autoFocus
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
          className="w-full mt-1 bg-shell-2 text-shell-text px-3 py-2 rounded-md border border-shell-border text-sm"
        />
        <div id="name-error" className="min-h-[18px] mt-1" aria-live="polite">
          {errors.name && (
            <span className="text-xs text-red-300" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="lift bg-shell-2 text-shell-text px-4 py-2 rounded-md text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="lift bg-accent text-white px-4 py-2 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function SavedThemes() {
  const savedThemes = useStore((s) => s.savedThemes);
  const activeThemeId = useStore((s) => s.activeThemeId);
  const createTheme = useStore((s) => s.createTheme);
  const renameTheme = useStore((s) => s.renameTheme);
  const deleteTheme = useStore((s) => s.deleteTheme);
  const loadTheme = useStore((s) => s.loadTheme);
  const saveSnapshot = useStore((s) => s.saveSnapshot);
  const restoreSnapshot = useStore((s) => s.restoreSnapshot);

  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [snapOpen, setSnapOpen] = useState(false);

  const filtered = useMemo(
    () => savedThemes.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())),
    [savedThemes, search]
  );
  const renameTarget = savedThemes.find((t) => t.id === renameId);
  const active = savedThemes.find((t) => t.id === activeThemeId);

  return (
    <section aria-label="Saved themes" className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold flex-1">Saved Themes</h2>
        <div className="flex items-center gap-2 bg-shell-1 rounded-md px-2 py-1.5 border border-shell-border">
          <Icon name="search" style={{ fontSize: 16 }} className="text-shell-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search saved themes"
            placeholder="Search saved themes"
            className="bg-transparent text-xs text-shell-text outline-none"
          />
        </div>
        {active && (
          <button type="button" onClick={() => setSnapOpen(true)} className="lift bg-shell-2 text-shell-text px-3 py-2 rounded-md text-sm flex items-center gap-1">
            <Icon name="photo_camera" style={{ fontSize: 16 }} />
            Snapshot
          </button>
        )}
        <button type="button" onClick={() => setNewOpen(true)} className="lift bg-accent text-white px-3 py-2 rounded-md text-sm flex items-center gap-1">
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
          <p className="text-sm text-shell-muted mt-1">Create your first theme with New Theme to save the current palette, typography, and shape.</p>
          <button type="button" onClick={() => setNewOpen(true)} className="lift bg-accent text-white px-4 py-2 rounded-md text-sm mt-4">
            New Theme
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-shell-border rounded-xl bg-shell-1">
          <h3 className="text-base font-medium">No Matches</h3>
          <p className="text-sm text-shell-muted mt-1">No saved theme matches “{search}”. Clear the search to see all themes.</p>
          <button type="button" onClick={() => setSearch('')} className="lift bg-shell-2 text-shell-text px-4 py-2 rounded-md text-sm mt-4">
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
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
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
                          <button key={i} type="button" onClick={() => restoreSnapshot(i)} disabled={activeThemeId !== t.id} className="inert-link text-[11px] bg-shell-2 px-1.5 py-0.5 rounded border border-shell-border disabled:opacity-40">
                            {sn.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button type="button" onClick={() => loadTheme(t.id)} className="lift bg-accent text-white text-xs px-2.5 py-1.5 rounded flex-1">
                    Load
                  </button>
                  <button type="button" onClick={() => setRenameId(t.id)} aria-label={`Rename ${t.name}`} className="lift bg-shell-2 text-shell-text text-xs px-2.5 py-1.5 rounded">
                    <Icon name="edit" style={{ fontSize: 15 }} />
                  </button>
                  <button type="button" onClick={() => deleteTheme(t.id)} aria-label={`Delete ${t.name}`} className="lift bg-shell-2 text-red-300 text-xs px-2.5 py-1.5 rounded">
                    <Icon name="delete" style={{ fontSize: 15 }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <NameDialog
        open={newOpen}
        title="New Theme"
        submitLabel="Create Theme"
        existing={savedThemes.map((t) => t.name)}
        onClose={() => setNewOpen(false)}
        onSubmit={(name) => createTheme(name)}
      />
      <NameDialog
        open={!!renameId}
        title="Rename Theme"
        submitLabel="Save Name"
        existing={savedThemes.filter((t) => t.id !== renameId).map((t) => t.name)}
        initial={renameTarget?.name}
        onClose={() => setRenameId(null)}
        onSubmit={(name) => renameTheme(renameId!, name)}
      />
      <NameDialog
        open={snapOpen}
        title="Save Snapshot"
        submitLabel="Save Snapshot"
        existing={[]}
        onClose={() => setSnapOpen(false)}
        onSubmit={(name) => saveSnapshot(name)}
      />
    </section>
  );
}
