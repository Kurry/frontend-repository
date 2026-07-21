import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, TextField } from '@mui/material';
import { RootState } from '../store/store';
import {
  addVersion,
  announce,
  deleteTheme,
  loadTheme,
  openThemeForm,
  restoreVersion,
} from '../store/themeSlice';
import Overlay from './Overlay';

export default function SavedThemes() {
  const dispatch = useDispatch();
  const themes = useSelector((state: RootState) => state.theme.themes);
  const activeId = useSelector((state: RootState) => state.theme.activeId);
  const dirty = useSelector((state: RootState) => state.theme.dirty);
  const activeTheme = themes.find(theme => theme.id === activeId);
  const [search, setSearch] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionError, setVersionError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exitingIds, setExitingIds] = useState<string[]>([]);

  const filtered = themes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const confirmTheme = themes.find(theme => theme.id === confirmDeleteId);

  const finishDelete = (id: string, name: string) => {
    setConfirmDeleteId(null);
    setExitingIds(current => [...current, id]);
    window.setTimeout(() => {
      dispatch(deleteTheme(id));
      setExitingIds(current => current.filter(existing => existing !== id));
      dispatch(announce(`Theme ${name} deleted`));
    }, 280);
  };

  const saveVersion = () => {
    const name = versionName.trim();
    if (!name) {
      const message = 'Version name is required — name the snapshot to save it';
      setVersionError(message);
      dispatch(announce(message));
      return;
    }
    dispatch(addVersion(name));
    setVersionName('');
    setVersionError('');
    dispatch(announce(`Version ${name} saved`));
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] p-8 text-white overflow-auto">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h2 className="text-3xl font-normal mb-2">Saved Themes</h2>
          <p className="text-gray-400 mb-4">Themes are saved in-memory for this session — reload to return to the seeded set.</p>
          <div className="flex items-center gap-4">
            <Button
              variant="contained"
              color="primary"
              onClick={() => dispatch(openThemeForm({ mode: 'create' }))}
              id="btn-new-theme"
              sx={{ minHeight: 44, minWidth: 132 }}
            >
              New Theme
            </Button>
            <div className="bg-gray-800 rounded flex items-center px-2 min-h-[44px] ml-auto w-64 border border-gray-700">
              <span className="material-symbols-outlined text-gray-400 text-sm mr-2" aria-hidden="true">search</span>
              <input
                type="search"
                placeholder="Search themes..."
                aria-label="Search saved themes"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-white"
              />
            </div>
          </div>
        </header>

        {themes.length === 0 ? (
          <div className="rounded border border-dashed border-gray-600 py-16 text-center">
            <p className="text-lg text-gray-300">No saved themes yet</p>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              This is where your theme collection lives — each saved theme appears as a card with swatches,
              a type-and-updated meta line, and Load / Rename / Delete actions.
            </p>
            <Button
              variant="contained"
              className="mt-5"
              sx={{ minHeight: 44 }}
              onClick={() => dispatch(openThemeForm({ mode: 'create' }))}
            >
              New Theme
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded border border-dashed border-gray-600 py-16 text-center">
            <p className="text-lg text-gray-300">No themes match “{search}”</p>
            <p className="mt-2 text-sm text-gray-500">Clear the search to see every saved theme again.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => {
              const p = t.options.palette;
              const isActive = t.id === activeId;
              const loadDisabled = isActive && dirty;
              const exiting = exitingIds.includes(t.id);

              return (
                <div
                  key={t.id}
                  data-theme-card={t.id}
                  className={`bg-[#1e1e1e] rounded overflow-hidden shadow-lg border transition-colors ${
                    isActive ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'
                  } ${exiting ? 'card-exiting' : 'animate-card-in'}`}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <strong className="text-lg font-medium truncate" title={t.name}>{t.name}</strong>
                      {isActive && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Active</span>
                      )}
                    </div>

                    <div className="flex rounded overflow-hidden h-12 shadow-inner bg-black" aria-hidden="true">
                      <span className="flex-1" style={{ background: p.primary.main }}></span>
                      <span className="flex-1" style={{ background: p.secondary.main }}></span>
                      <span className="flex-1" style={{ background: p.background?.paper ?? '#fff' }}></span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {p.type} · updated {new Date(t.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gray-900 p-3 flex gap-2 border-t border-gray-800">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={loadDisabled}
                      title={loadDisabled ? 'Already loaded — save or undo your unsaved changes first' : undefined}
                      onClick={() => {
                        dispatch(loadTheme(t.id));
                        dispatch(announce(`Theme ${t.name} loaded into the editor and preview`));
                      }}
                      sx={{ minHeight: 44, flex: 1 }}
                      data-load={t.id}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => dispatch(openThemeForm({ mode: 'rename', themeId: t.id }))}
                      sx={{ minHeight: 44, flex: 1 }}
                      data-rename={t.id}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setConfirmDeleteId(t.id)}
                      sx={{ minHeight: 44, flex: 1 }}
                      data-delete={t.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTheme && (
          <section className="mt-8 rounded border border-gray-700 bg-[#1e1e1e] p-4" aria-labelledby="versions-heading">
            <h3 id="versions-heading" className="text-xl mb-3">Versions</h3>
            <div className="flex flex-wrap items-start gap-3">
              <TextField
                label="Version name"
                size="small"
                value={versionName}
                onChange={(event) => {
                  setVersionName(event.target.value);
                  if (event.target.value.trim()) setVersionError('');
                }}
                error={!!versionError}
                helperText={versionError}
                inputProps={{ maxLength: 64, 'aria-label': 'Version name' }}
              />
              <Button variant="contained" onClick={saveVersion} sx={{ minHeight: 44 }}>
                Save version
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {activeTheme.versions?.length ? activeTheme.versions.map((version, index) => (
                <div key={`${version.createdAt}-${index}`} className="flex items-center justify-between gap-3 rounded bg-gray-900 p-3">
                  <span>{version.name}</span>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ minHeight: 44 }}
                    onClick={() => {
                      dispatch(restoreVersion(version.options));
                      dispatch(announce(`Version ${version.name} restored — theme marked unsaved`));
                    }}
                  >
                    Restore
                  </Button>
                </div>
              )) : <p className="text-sm text-gray-400">No versions saved for this theme.</p>}
            </div>
          </section>
        )}
      </div>

      <Overlay
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        labelledBy="delete-theme-title"
        widthClass="w-full max-w-sm"
      >
        <div className="px-5 py-4">
          <h2 id="delete-theme-title" className="text-lg font-semibold text-gray-900">
            Delete theme?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Delete “{confirmTheme?.name}”? This removes the card from Saved Themes
            {confirmTheme?.id === activeId ? ' and clears it as the active theme' : ''}. This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <Button onClick={() => setConfirmDeleteId(null)} sx={{ minHeight: 44 }} data-autofocus>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ minHeight: 44 }}
            onClick={() => confirmTheme && finishDelete(confirmTheme.id, confirmTheme.name)}
          >
            Delete
          </Button>
        </div>
      </Overlay>
    </div>
  );
}
