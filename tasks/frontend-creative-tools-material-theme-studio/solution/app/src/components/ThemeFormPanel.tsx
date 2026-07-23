import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField } from '@mui/material';
import { RootState } from '../store/store';
import { announce, closeThemeForm, createTheme, updateTheme } from '../store/themeSlice';
import Overlay from './Overlay';

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Theme name is required — enter a name for the theme')
    .max(64, 'Theme name must be 64 characters or fewer'),
});

type FormData = z.infer<typeof baseSchema>;

/**
 * Store-driven create/rename form. Rendered at the Shell level as a focus-trapped
 * but click-through panel, so main tabs stay operable while the form is open.
 */
export default function ThemeFormPanel() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.theme.themeForm);
  const themes = useSelector((state: RootState) => state.theme.themes);

  const open = form !== null;
  const mode = form?.mode ?? 'create';
  const editingTheme = form?.mode === 'rename' ? themes.find(theme => theme.id === form.themeId) : undefined;
  const initialName = editingTheme?.name ?? '';
  const otherNames = useMemo(
    () => themes.filter(theme => theme.id !== editingTheme?.id).map(theme => theme.name.trim().toLocaleLowerCase()),
    [themes, editingTheme?.id]
  );

  const schema = useMemo(
    () =>
      baseSchema.refine(data => !otherNames.includes(data.name.trim().toLocaleLowerCase()), {
        path: ['name'],
        message: 'Theme name must be unique — choose a different name',
      }),
    [otherNames]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { name: initialName },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const nameValue = watch('name') ?? '';



  // Announce inline validation problems to the polite live region.
  const errorMessage = errors.name?.message ?? (!nameValue.trim() ? 'Theme name is required — enter a name for the theme' : '');
  useEffect(() => {
    if (open && errorMessage) dispatch(announce(errorMessage));
  }, [open, errorMessage, dispatch]);

  const close = () => {
    dispatch(closeThemeForm());
  };

  const onValid = (data: FormData) => {
    const name = data.name;
    if (mode === 'rename') {
      // The panel is click-through, so the target theme can be deleted while
      // the rename form stays open — cancel instead of falling through to
      // createTheme (which would spawn a duplicate under a "Rename" UI).
      if (!editingTheme) {
        dispatch(announce('That theme was deleted — rename cancelled'));
        close();
        return;
      }
      dispatch(updateTheme({ id: editingTheme.id, name }));
      dispatch(announce(`Theme renamed to ${name}`));
    } else {
      dispatch(createTheme({ id: `theme-${Date.now()}-${Math.random().toString(36).slice(2)}`, name }));
      dispatch(announce(`Theme ${name} created — it is now the active theme`));
    }
    close();
  };

  const title = mode === 'rename' ? 'Rename Theme' : 'New Theme';

  return (
    <Overlay
      open={open}
      onClose={close}
      label={title}
      backdrop={false}
      widthClass="w-full max-w-sm"
      zClass="z-[1250]"
    >
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          The tab bar stays active while this form is open — focus is kept inside the form for keyboard use.
        </p>
      </div>
      <form onSubmit={handleSubmit(onValid)} noValidate>
        <div className="px-5 py-4">
          <TextField
            label="Theme name"
            {...register('name')}
            error={!!errorMessage}
            helperText={errorMessage}
            fullWidth
            autoFocus
            inputProps={{ maxLength: 80, 'aria-label': 'Theme name' }}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <Button type="button" onClick={close} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid}
            sx={{ minHeight: 44 }}
          >
            {mode === 'rename' ? 'Rename Theme' : 'Create Theme'}
          </Button>
        </div>
      </form>
    </Overlay>
  );
}
