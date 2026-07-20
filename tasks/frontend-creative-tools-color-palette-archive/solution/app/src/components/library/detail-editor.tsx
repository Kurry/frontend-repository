import { component$, useContext, useSignal, useTask$, $ } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { generateId, getContrastRatio } from '../../utils/colors';
import type { Palette } from '../../store/types';
import { saveState } from '../../utils/undo-redo';

export const DetailEditor = component$(() => {
  const store = useContext(GlobalStoreContext);
  const isOpen = store.selectionId !== null;
  const isNew = store.selectionId === 'new';

  const formState = useSignal<Palette | null>(null);
  // Tracks which selectionId the current formState was initialized for, so
  // this task can tell "selection changed, (re)load the record" apart from
  // "some other palette mutated elsewhere" — the latter must not clobber
  // in-progress create/edit input.
  const initializedFor = useSignal<string | null>(null);

  useTask$(({ track }) => {
    const selectionId = track(() => store.selectionId);

    if (selectionId === null) {
      formState.value = null;
      initializedFor.value = null;
      return;
    }

    if (selectionId === 'new') {
      if (initializedFor.value !== 'new') {
        formState.value = {
          id: generateId(),
          name: '',
          artist: '',
          period: '' as any,
          swatches: ['#000000', '#ffffff', '#cccccc'],
          favorite: false
        };
        initializedFor.value = 'new';
      }
      return;
    }

    // Only subscribe to whether *this specific* palette still exists (by id),
    // not to every field of every palette — so an unrelated mutation (favorite
    // toggle, undo/redo, WebMCP edit of another record, etc.) doesn't re-run
    // this task and wipe in-progress input.
    const stillExists = track(() => store.palettes.some(p => p.id === selectionId));
    if (!stillExists) {
      // The palette we were viewing/editing was deleted or replaced elsewhere
      // (e.g. WebMCP entity_delete or an import) — close the editor instead of
      // leaving selectionId pointing at a record that no longer exists, which
      // would otherwise hide the dialog while the app still thinks it's open.
      formState.value = null;
      initializedFor.value = null;
      store.selectionId = null;
      return;
    }

    if (initializedFor.value !== selectionId) {
      const p = store.palettes.find(p => p.id === selectionId)!;
      formState.value = { ...p, swatches: [...p.swatches] };
      initializedFor.value = selectionId;
    }
  });

  if (!isOpen || !formState.value) return null;
  const palette = formState.value;

  // Per-field validation, recomputed on every form change; the save control
  // stays disabled until every field is valid.
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const errors = {
    name: palette.name.trim() === ''
      ? 'Name is required.'
      : palette.name.length > 80 ? 'Name must be at most 80 characters.' : '',
    artist: palette.artist.trim() === ''
      ? 'Artist is required.'
      : palette.artist.length > 80 ? 'Artist must be at most 80 characters.' : '',
    period: !palette.period ? 'Period is required — choose one from the list.' : '',
    swatches: palette.swatches.length < 3 || palette.swatches.length > 12
      ? 'Swatches must number between 3 and 12.'
      : palette.swatches.some(h => !hexRegex.test(h))
        ? 'Every swatch must be a six-digit hex value with a leading # (e.g. #a1b2c3).'
        : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = $((e: Event) => {
    e.preventDefault();
    if (hasErrors) return;

    saveState(store);
    if (isNew) {
      store.palettes = [...store.palettes, palette];
    } else {
      store.palettes = store.palettes.map(p => p.id === palette.id ? palette : p);
    }
    store.selectionId = null;
  });

  return (
    <dialog open class="modal modal-open" aria-labelledby="dialog_title" role="dialog">
      <div class="modal-box w-11/12 max-w-5xl bg-[#fffaf0] text-black border border-gray-300 rounded-none shadow-xl" role="document">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick$={() => store.selectionId = null} aria-label="Close">✕</button>
        </form>
        <h3 id="dialog_title" class="font-bold text-2xl font-serif mb-6">{isNew ? 'New Palette' : 'Edit Palette'}</h3>

        <form class="grid md:grid-cols-2 gap-8" onSubmit$={handleSave}>
          <div class="flex flex-col gap-4">
             <label class="form-control w-full">
                <div class="label"><span class="label-text font-bold uppercase tracking-widest text-xs" id="palette_name_label">Name</span></div>
                <input type="text" value={palette.name} onInput$={(e) => formState.value = { ...palette, name: (e.target as HTMLInputElement).value }} aria-labelledby="palette_name_label" aria-invalid={!!errors.name} class="input input-bordered w-full rounded-none border-gray-400 bg-white" required />
                {errors.name && <div class="label"><span class="label-text-alt text-red-700" role="alert">{errors.name}</span></div>}
             </label>
             <label class="form-control w-full">
                <div class="label"><span class="label-text font-bold uppercase tracking-widest text-xs" id="palette_artist_label">Artist</span></div>
                <input type="text" value={palette.artist} onInput$={(e) => formState.value = { ...palette, artist: (e.target as HTMLInputElement).value }} aria-labelledby="palette_artist_label" aria-invalid={!!errors.artist} class="input input-bordered w-full rounded-none border-gray-400 bg-white" required />
                {errors.artist && <div class="label"><span class="label-text-alt text-red-700" role="alert">{errors.artist}</span></div>}
             </label>
             <label class="form-control w-full">
                <div class="label"><span class="label-text font-bold uppercase tracking-widest text-xs" id="palette_period_label">Period</span></div>
                <select value={palette.period} onChange$={(e) => formState.value = { ...palette, period: (e.target as HTMLSelectElement).value as any }} aria-labelledby="palette_period_label" aria-invalid={!!errors.period} class="select select-bordered rounded-none border-gray-400 bg-white" required>
                   <option value="" disabled>Select period</option>
                   {[
                      "Abstract + Geometric", "Americana", "Baroque to Neoclassical",
                      "Expressionism", "Fauvism", "Impressionism", "Medieval",
                      "Modern", "Old Masters", "Post-Impressionism",
                      "Primitive + Folk", "Realism", "Romanticism", "Symbolism", "Tonalism"
                    ].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.period && <div class="label"><span class="label-text-alt text-red-700" role="alert">{errors.period}</span></div>}
             </label>

             <div class="form-control">
                <div class="label" id="swatches_label"><span class="label-text font-bold uppercase tracking-widest text-xs">Swatches (3-12)</span></div>
                <div class="flex flex-col gap-2" role="group" aria-labelledby="swatches_label">
                   {palette.swatches.map((swatch, idx) => (
                      <div key={idx} class="flex gap-2 items-center">
                         <input type="color" value={swatch} onChange$={(e) => {
                            const newSwatches = [...palette.swatches];
                            newSwatches[idx] = (e.target as HTMLInputElement).value;
                            formState.value = { ...palette, swatches: newSwatches };
                         }} class="w-10 h-10 border-0 p-0" aria-label={`Swatch ${idx + 1} Color Picker`} />
                         <input type="text" value={swatch} pattern="^#[0-9A-Fa-f]{6}$" class="input input-bordered input-sm flex-1 rounded-none border-gray-400 bg-white font-mono lowercase" onChange$={(e) => {
                             const newSwatches = [...palette.swatches];
                             newSwatches[idx] = (e.target as HTMLInputElement).value;
                             formState.value = { ...palette, swatches: newSwatches };
                         }} aria-label={`Swatch ${idx + 1} Hex Value`} />
                         <button type="button" class="btn btn-sm btn-ghost hover:text-red-500" aria-label={`Remove Swatch ${idx + 1}`} disabled={palette.swatches.length <= 3} onClick$={() => {
                             const newSwatches = palette.swatches.filter((_, i) => i !== idx);
                             formState.value = { ...palette, swatches: newSwatches };
                         }}>✕</button>
                      </div>
                   ))}
                </div>
                {palette.swatches.length < 12 && (
                   <button type="button" class="btn btn-sm btn-outline rounded-none mt-2 self-start" onClick$={() => {
                       formState.value = { ...palette, swatches: [...palette.swatches, '#000000'] };
                   }}>+ Add Swatch</button>
                )}
                {errors.swatches && <div class="label"><span class="label-text-alt text-red-700" role="alert">{errors.swatches}</span></div>}
             </div>
          </div>

          <div class="flex flex-col gap-6">
             <div>
                <h4 class="font-bold uppercase tracking-widest text-xs mb-2">Contrast Matrix</h4>
                <div class="overflow-x-auto border border-gray-300">
                  <table class="table table-xs w-full">
                     <thead>
                       <tr>
                         <th scope="col">Contrast</th>
                         {palette.swatches.map((s, i) => <th scope="col" key={i}><div class="w-4 h-4 rounded-full mx-auto border border-gray-200" style={{backgroundColor: s}} title={s}></div></th>)}
                       </tr>
                     </thead>
                     <tbody>
                       {palette.swatches.map((rowSwatch, i) => (
                         <tr key={i}>
                           <th scope="row"><div class="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: rowSwatch}} title={rowSwatch}></div></th>
                           {palette.swatches.map((colSwatch, j) => {
                              const ratio = getContrastRatio(rowSwatch, colSwatch);
                              const aaPass = ratio >= 4.5;
                              const aaaPass = ratio >= 7;
                              return (
                                <td key={j} class={`text-center font-mono ${aaPass ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                                  <div>{ratio.toFixed(1)}</div>
                                  <div class="flex flex-col text-[9px] uppercase tracking-wide font-sans font-bold leading-tight">
                                    <span class={aaPass ? 'text-green-700' : 'text-red-600'}>{aaPass ? 'AA Pass' : 'AA Fail'}</span>
                                    <span class={aaaPass ? 'text-green-700' : 'text-red-600'}>{aaaPass ? 'AAA Pass' : 'AAA Fail'}</span>
                                  </div>
                                </td>
                              )
                           })}
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
             </div>

             <div class="mt-auto flex justify-end gap-2">
                <button type="button" class="btn btn-outline rounded-none" onClick$={() => store.selectionId = null}>Cancel</button>
                <button type="submit" class="btn btn-neutral rounded-none text-white" disabled={hasErrors}>{isNew ? 'Create' : 'Save'} Palette</button>
             </div>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" onClick$={() => store.selectionId = null}>
        <span class="sr-only">Close dialog background</span>
      </div>
    </dialog>
  );
});
