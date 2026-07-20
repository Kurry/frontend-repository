import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { loadTheme, deleteTheme, createTheme, updateTheme, addVersion, restoreVersion } from '../store/themeSlice';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(64, 'Name too long')
});

type FormData = z.infer<typeof schema>;

function ThemeFormModal({
  open,
  onClose,
  existingThemes,
  initialName = '',
  onSubmit
}: {
  open: boolean,
  onClose: () => void,
  existingThemes: string[],
  initialName?: string,
  onSubmit: (name: string) => void
}) {
  const formSchema = useMemo(() => schema.refine(
    data => !existingThemes.includes(data.name) || data.name === initialName,
    { path: ['name'], message: 'Name must be unique' }
  ), [existingThemes, initialName]);
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: initialName },
    mode: 'onChange'
  });

  const onValid = (data: FormData) => {
    onSubmit(data.name);
    reset({ name: '' });
  };

  return (
    <Dialog open={open} onClose={() => { reset({name: initialName}); onClose(); }} fullWidth maxWidth="sm">
      <DialogTitle>{initialName ? 'Rename Theme' : 'New Theme'}</DialogTitle>
      <form onSubmit={handleSubmit(onValid)}>
        <DialogContent>
          <TextField
            label="Theme Name"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { reset({name: initialName}); onClose(); }} type="button">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            {initialName ? 'Rename Theme' : 'Create Theme'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function SavedThemes() {
  const dispatch = useDispatch();
  const themes = useSelector((state: RootState) => state.theme.themes);
  const activeId = useSelector((state: RootState) => state.theme.activeId);
  const activeTheme = themes.find(theme => theme.id === activeId);
  const [search, setSearch] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionError, setVersionError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const editingTheme = themes.find(theme => theme.id === editingThemeId);

  const filtered = themes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#121212] p-8 text-white">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h2 className="text-3xl font-normal mb-2">Saved Themes</h2>
          <p className="text-gray-400 mb-4">Themes are saved in Redux state (in-memory) for this session.</p>
          <div className="flex items-center gap-4">
            <Button variant="contained" color="primary" onClick={() => { setEditingThemeId(null); setModalOpen(true); }} id="btn-new-theme">
              New Theme
            </Button>
            <div className="bg-gray-800 rounded flex items-center px-2 py-1 ml-auto w-64 border border-gray-700">
              <span className="material-symbols-outlined text-gray-400 text-sm mr-2">search</span>
              <input
                type="search"
                placeholder="Search themes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-white"
              />
            </div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No themes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => {
              const p = t.options.palette;
              const isActive = t.id === activeId;

              return (
                <div key={t.id} className={`bg-[#1e1e1e] rounded overflow-hidden shadow-lg border ${isActive ? 'border-blue-500' : 'border-gray-700'}`}>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <strong className="text-lg font-medium truncate" title={t.name}>{t.name}</strong>
                      {isActive && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Active</span>}
                    </div>

                    <div className="flex rounded overflow-hidden h-12 shadow-inner bg-black">
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
                      onClick={() => dispatch(loadTheme(t.id))}
                      disabled={isActive}
                      data-load={t.id}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => { setEditingThemeId(t.id); setModalOpen(true); }}
                      data-rename={t.id}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={themes.length === 1}
                      onClick={() => {
                        if (window.confirm(`Delete ${t.name}?`)) {
                          dispatch(deleteTheme(t.id));
                        }
                      }}
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
                inputProps={{ maxLength: 64 }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  const name = versionName.trim();
                  if (!name) {
                    setVersionError('Version name is required');
                    return;
                  }
                  dispatch(addVersion(name));
                  setVersionName('');
                  setVersionError('');
                }}
              >
                Save version
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {activeTheme.versions?.length ? activeTheme.versions.map((version, index) => (
                <div key={`${version.createdAt}-${index}`} className="flex items-center justify-between gap-3 rounded bg-gray-900 p-3">
                  <span>{version.name}</span>
                  <Button size="small" variant="outlined" onClick={() => dispatch(restoreVersion(version.options))}>
                    Restore
                  </Button>
                </div>
              )) : <p className="text-sm text-gray-400">No versions saved for this theme.</p>}
            </div>
          </section>
        )}
      </div>

      <ThemeFormModal
        key={editingTheme?.id ?? 'create'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingThemeId(null); }}
        existingThemes={themes.map(t => t.name)}
        initialName={editingTheme?.name ?? ''}
        onSubmit={(name) => {
          if (editingTheme) dispatch(updateTheme({ id: editingTheme.id, name }));
          else dispatch(createTheme({ id: 'theme-' + Date.now(), name }));
          setModalOpen(false);
          setEditingThemeId(null);
        }}
      />
    </div>
  );
}
