import { createSignal, For, Show } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import { z } from "zod";
import { store, APERTURE_STOPS, SHUTTER_STOPS, ISO_STOPS, createPreset, updatePreset } from "./store";

const schema = z.object({
  name: z.string().trim().min(1, "required — enter a 1–64 character name").max(64, "must be 64 characters or fewer"),
  aperture: z.number().refine((v) => APERTURE_STOPS.includes(v), "must be a supported f-stop"),
  shutter: z.number().refine((v) => SHUTTER_STOPS.includes(v), "must be a supported shutter speed"),
  iso: z.number().refine((v) => ISO_STOPS.includes(v), "must be a supported ISO"),
  lookTag: z.string().trim().min(1, "required — add a 1–32 character look tag").max(32, "must be 32 characters or fewer"),
  favorite: z.boolean().default(false),
});

const FIELD_LABEL = { name: "Name", aperture: "Aperture", shutter: "Speed", iso: "ISO", lookTag: "Look tag" };

export default function PresetForm(props) {
  const isEdit = () => !!props.preset;
  const [submitting, setSubmitting] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: isEdit() ? {
      name: props.preset.name, aperture: props.preset.aperture, shutter: props.preset.shutter,
      iso: props.preset.iso, lookTag: props.preset.lookTag, favorite: props.preset.favorite,
    } : {
      name: "", aperture: store.aperture, shutter: store.shutter, iso: store.iso, lookTag: "", favorite: false,
    },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      if (submitting()) return;
      setSubmitting(true);
      const data = schema.parse(value);
      if (isEdit()) updatePreset(props.preset.id, data);
      else createPreset(data);
      props.onClose();
    },
  }));

  const Err = (field, label) => (
    <Show when={field().state.meta.errors.length}>
      <span class="val-enter text-[11px] text-primary-soft block mt-0.5" role="alert">{label}: {field().state.meta.errors[0]}</span>
    </Show>
  );

  return (
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={isEdit() ? "Edit preset" : "Create preset"}>
      <div class="bg-ink border border-white/15 rounded-2xl shadow-2xl w-full max-w-md p-6 pop-in">
        <h2 class="font-display text-xl uppercase tracking-widest mb-5">{isEdit() ? "Edit preset" : "Save preset"}</h2>
        <form class="space-y-3" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
          <form.Field name="name">
            {(f) => (
              <div>
                <label for="pf-name" class="font-display text-[11px] uppercase tracking-wider text-white/60">Name</label>
                <input id="pf-name" value={f().state.value} onBlur={f().handleBlur} onInput={(e) => f().handleChange(e.target.value)} aria-invalid={!!f().state.meta.errors.length} aria-describedby="pf-name-err" class="w-full bg-black/40 border border-white/15 rounded px-2 py-1.5 text-sm text-white" placeholder="e.g. Golden Hour Soft" />
                <span id="pf-name-err">{Err(f, FIELD_LABEL.name)}</span>
              </div>
            )}
          </form.Field>
          <div class="grid grid-cols-3 gap-3">
            <form.Field name="aperture">
              {(f) => (
                <div>
                  <label for="pf-ap" class="font-display text-[11px] uppercase tracking-wider text-white/60">Aperture</label>
                  <select id="pf-ap" value={f().state.value} onBlur={f().handleBlur} onChange={(e) => f().handleChange(Number(e.target.value))} class="w-full bg-black/40 border border-white/15 rounded px-1 py-1.5 text-sm text-white">
                    <For each={APERTURE_STOPS}>{(v) => <option value={v}>f/{v}</option>}</For>
                  </select>
                  {Err(f, FIELD_LABEL.aperture)}
                </div>
              )}
            </form.Field>
            <form.Field name="shutter">
              {(f) => (
                <div>
                  <label for="pf-sh" class="font-display text-[11px] uppercase tracking-wider text-white/60">Speed</label>
                  <select id="pf-sh" value={f().state.value} onBlur={f().handleBlur} onChange={(e) => f().handleChange(Number(e.target.value))} class="w-full bg-black/40 border border-white/15 rounded px-1 py-1.5 text-sm text-white">
                    <For each={SHUTTER_STOPS}>{(v) => <option value={v}>1/{v}</option>}</For>
                  </select>
                  {Err(f, FIELD_LABEL.shutter)}
                </div>
              )}
            </form.Field>
            <form.Field name="iso">
              {(f) => (
                <div>
                  <label for="pf-iso" class="font-display text-[11px] uppercase tracking-wider text-white/60">ISO</label>
                  <select id="pf-iso" value={f().state.value} onBlur={f().handleBlur} onChange={(e) => f().handleChange(Number(e.target.value))} class="w-full bg-black/40 border border-white/15 rounded px-1 py-1.5 text-sm text-white">
                    <For each={ISO_STOPS}>{(v) => <option value={v}>{v}</option>}</For>
                  </select>
                  {Err(f, FIELD_LABEL.iso)}
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="lookTag">
            {(f) => (
              <div>
                <label for="pf-tag" class="font-display text-[11px] uppercase tracking-wider text-white/60">Look tag</label>
                <input id="pf-tag" value={f().state.value} onBlur={f().handleBlur} onInput={(e) => f().handleChange(e.target.value)} aria-invalid={!!f().state.meta.errors.length} aria-describedby="pf-tag-err" class="w-full bg-black/40 border border-white/15 rounded px-2 py-1.5 text-sm text-white" placeholder="e.g. Portrait" />
                <span id="pf-tag-err">{Err(f, FIELD_LABEL.lookTag)}</span>
              </div>
            )}
          </form.Field>
          <form.Field name="favorite">
            {(f) => (
              <label class="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={f().state.value} onChange={(e) => f().handleChange(e.target.checked)} class="w-4 h-4 accent-primary" />
                Mark as favorite
              </label>
            )}
          </form.Field>
          <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={props.onClose} class="hover-wash rounded px-4 py-2 text-sm text-white/70">Cancel</button>
            <form.Subscribe selector={(s) => s.canSubmit}>
              {(canSubmit) => (
                <button type="submit" disabled={!canSubmit() || submitting()} class="hover-wash rounded px-5 py-2 bg-primary hover:bg-primary-soft text-white text-sm font-display tracking-wide disabled:opacity-40 disabled:cursor-not-allowed">
                  {isEdit() ? "Update preset" : "Save preset"}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}
