import { createForm } from '@tanstack/solid-form';
import { z } from 'zod';
import { store, setStore, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, generatePresetId } from './store';
import { Show, For } from 'solid-js';

const presetSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Name is too long"),
  aperture: z.number().refine(v => APERTURE_STOPS.includes(v), "Invalid aperture"),
  shutter: z.number().refine(v => SHUTTER_STOPS.includes(v), "Invalid shutter speed"),
  iso: z.number().refine(v => ISO_STOPS.includes(v), "Invalid ISO"),
  lookTag: z.string().min(1, "Tag is required").max(32, "Tag is too long"),
  favorite: z.boolean().default(false),
});

export default function PresetForm(props) {
  const isEditing = !!props.preset;

  const form = createForm(() => ({
    defaultValues: isEditing ? {
      name: props.preset.name,
      aperture: props.preset.aperture,
      shutter: props.preset.shutter,
      iso: props.preset.iso,
      lookTag: props.preset.lookTag,
      favorite: props.preset.favorite,
    } : {
      name: "",
      aperture: store.aperture,
      shutter: store.shutter,
      iso: store.iso,
      lookTag: "",
      favorite: false,
    },
    validators: {
      onChange: presetSchema,
    },
    onSubmit: async ({ value }) => {
      const validData = presetSchema.parse(value);
      if (isEditing) {
        if (window.webmcp_tools && window.webmcp_tools['entity_update']) {
          window.webmcp_tools['entity_update']({
            entity: 'preset',
            id: props.preset.id,
            fields: validData
          });
        } else {
          setStore('presets', p => p.id === props.preset.id, p => ({ ...p, ...validData }));
        }
      } else {
        if (window.webmcp_tools && window.webmcp_tools['entity_create']) {
          window.webmcp_tools['entity_create']({
            entity: 'preset',
            fields: validData
          });
        } else {
          const newPreset = {
            id: generatePresetId(),
            ...validData
          };
          setStore('presets', p => [...p, newPreset]);
        }
      }
      props.onClose();
    },
  }));

  const FieldError = (props) => (
    <Show when={props.field().state.meta.errors.length > 0}>
      <div class="text-red-500 text-xs mt-1">{props.field().state.meta.errors.join(', ')}</div>
    </Show>
  );

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <h2 class="text-2xl font-bold mb-6">{isEditing ? 'Edit Preset' : 'Save Preset'}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          class="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div>
                <label for="preset-name" class="block text-sm font-medium text-gray-400 mb-1">Preset Name</label>
                <input
                  id="preset-name"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onInput={(e) => field().handleChange(e.target.value)}
                  class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                  placeholder="e.g. Moody Night"
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>

          <div class="grid grid-cols-3 gap-4">
            <form.Field name="aperture">
              {(field) => (
                <div>
                  <label for="preset-aperture" class="block text-sm font-medium text-gray-400 mb-1">Aperture</label>
                  <select
                    id="preset-aperture"
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onChange={(e) => field().handleChange(Number(e.target.value))}
                    class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  >
                    <For each={APERTURE_STOPS}>{v => <option value={v}>f/{v}</option>}</For>
                  </select>
                  <FieldError field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="shutter">
              {(field) => (
                <div>
                  <label for="preset-shutter" class="block text-sm font-medium text-gray-400 mb-1">Shutter</label>
                  <select
                    id="preset-shutter"
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onChange={(e) => field().handleChange(Number(e.target.value))}
                    class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  >
                    <For each={SHUTTER_STOPS}>{v => <option value={v}>1/{v}</option>}</For>
                  </select>
                  <FieldError field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="iso">
              {(field) => (
                <div>
                  <label for="preset-iso" class="block text-sm font-medium text-gray-400 mb-1">ISO</label>
                  <select
                    id="preset-iso"
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onChange={(e) => field().handleChange(Number(e.target.value))}
                    class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  >
                    <For each={ISO_STOPS}>{v => <option value={v}>{v}</option>}</For>
                  </select>
                  <FieldError field={field} />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="lookTag">
            {(field) => (
              <div>
                <label for="preset-look-tag" class="block text-sm font-medium text-gray-400 mb-1">Look Tag</label>
                <input
                  id="preset-look-tag"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onInput={(e) => field().handleChange(e.target.value)}
                  class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                  placeholder="e.g. Portrait"
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="favorite">
            {(field) => (
              <div class="flex items-center space-x-2">
                <input
                  id="preset-favorite"
                  type="checkbox"
                  name={field().name}
                  checked={field().state.value}
                  onChange={(e) => field().handleChange(e.target.checked)}
                  class="w-4 h-4 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary focus:ring-offset-gray-900"
                />
                <label for="preset-favorite" class="text-sm font-medium text-gray-300">Mark as favorite</label>
              </div>
            )}
          </form.Field>

          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800 mt-6">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  class="px-6 py-2 text-sm font-bold bg-primary text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Preset'}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}
