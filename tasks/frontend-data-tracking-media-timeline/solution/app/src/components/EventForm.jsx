import { createForm } from '@tanstack/solid-form';
import { Show, For, onMount, createSignal } from 'solid-js';
import { TimelineEventSchema } from '../schema';
import { addEvent, updateEvent } from '../store';
import { MT_DATA } from '../data';

export default function EventForm({ initialData, onClose }) {
  const [globalError, setGlobalError] = createSignal(null);
  
  const form = createForm(() => ({
    defaultValues: initialData || {
      title: '',
      type: 'Milestone',
      timestamp: new Date().toISOString(),
      mediaRefs: [''],
      year: new Date().getUTCFullYear(),
      place: '',
      categories: [],
      summary: '',
      source: 'user',
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = TimelineEventSchema.parse(value);
        if (initialData?.id) {
          updateEvent(initialData.id, parsed);
        } else {
          addEvent(parsed);
        }
        onClose();
      } catch (err) {
        setGlobalError(err.errors[0]?.message || 'Validation failed');
      }
    },
  }));

  const handleMediaRefsChange = (idx, val, field) => {
    const current = [...field.state.value];
    current[idx] = val;
    field.handleChange(current);
  };
  
  const addMediaRef = (field) => {
    const current = [...field.state.value];
    if (current.length < 8) field.handleChange([...current, '']);
  };

  const removeMediaRef = (idx, field) => {
    const current = [...field.state.value];
    if (current.length > 1) {
      current.splice(idx, 1);
      field.handleChange(current);
    }
  };

  const toggleCategory = (catId, field) => {
    const current = [...field.state.value];
    const idx = current.indexOf(catId);
    if (idx !== -1) current.splice(idx, 1);
    else current.push(catId);
    field.handleChange(current);
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-bold">{initialData ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} class="text-gray-500 hover:text-black">✕</button>
        </div>
        <div class="p-4 overflow-y-auto flex-1">
          <Show when={globalError()}>
            <div class="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm">{globalError()}</div>
          </Show>
          <form
            id="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            class="space-y-4"
          >
            <form.Field name="title">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium">Title</label>
                  <input class="w-full border p-2 rounded" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)} />
                </div>
              )}
            </form.Field>

            <div class="grid grid-cols-2 gap-4">
              <form.Field name="type">
                {(field) => (
                  <div>
                    <label class="block text-sm font-medium">Type</label>
                    <select class="w-full border p-2 rounded" value={field().state.value} onChange={(e) => field().handleChange(e.target.value)}>
                      {["Milestone", "Invention", "Release", "Publication", "Broadcast"].map(t => <option value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </form.Field>
              <form.Field name="year">
                {(field) => (
                  <div>
                    <label class="block text-sm font-medium">Year</label>
                    <input type="number" class="w-full border p-2 rounded" value={field().state.value} onInput={(e) => field().handleChange(parseInt(e.target.value, 10) || 0)} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="timestamp">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium">Timestamp (ISO-8601 Z)</label>
                  <input class="w-full border p-2 rounded" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)} />
                </div>
              )}
            </form.Field>
            
            <form.Field name="place">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium">Place</label>
                  <input class="w-full border p-2 rounded" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)} />
                </div>
              )}
            </form.Field>

            <form.Field name="mediaRefs">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium mb-1">Media Refs (1 to 8)</label>
                  <div class="space-y-2">
                    <For each={field().state.value}>
                      {(ref, idx) => (
                        <div class="flex gap-2">
                          <input class="flex-1 border p-2 rounded" value={ref} onInput={(e) => handleMediaRefsChange(idx(), e.target.value, field())} />
                          <button type="button" onClick={() => removeMediaRef(idx(), field())} class="px-3 bg-red-100 text-red-600 rounded">Remove</button>
                        </div>
                      )}
                    </For>
                    <button type="button" onClick={() => addMediaRef(field())} class="text-sm text-blue-600">Add Media Ref</button>
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="categories">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium mb-1">Categories</label>
                  <div class="flex flex-wrap gap-2">
                    <For each={MT_DATA.categories}>
                      {(cat) => (
                        <label class="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 border rounded cursor-pointer hover:bg-gray-100">
                          <input type="checkbox" checked={field().state.value.includes(cat.id)} onChange={() => toggleCategory(cat.id, field())} />
                          {cat.label}
                        </label>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="summary">
              {(field) => (
                <div>
                  <label class="block text-sm font-medium">Summary</label>
                  <textarea class="w-full border p-2 rounded h-20" value={field().state.value} onInput={(e) => field().handleChange(e.target.value)}></textarea>
                </div>
              )}
            </form.Field>
          </form>
        </div>
        <div class="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button type="submit" form="event-form" class="px-4 py-2 bg-blue-600 text-white rounded font-medium">Save Event</button>
        </div>
      </div>
    </div>
  );
}
