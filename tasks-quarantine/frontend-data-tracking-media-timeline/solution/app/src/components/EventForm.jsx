import { createSignal, createMemo, Show, For, onMount } from "solid-js";
import Modal from "./Modal";
import { CATEGORIES, TYPES, addEvent, updateEvent } from "../store";
import { normalizeEvent, validateEventFields } from "../schema";
import { fmtYear } from "../format";
import { IconX, IconPlus } from "@tabler/icons-solidjs";

function Field(props) {
  return (
    <div class="flex flex-col gap-1">
      <label for={props.id} class="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
        {props.label}
      </label>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-[#a33b4a] anim-fade" role="alert">
          {props.error}
        </p>
      </Show>
    </div>
  );
}

export default function EventForm(props) {
  const editing = () => !!props.initialData;
  const init = () => props.initialData || {};

  const [title, setTitle] = createSignal(init().title ?? "");
  const [type, setType] = createSignal(init().type ?? "Milestone");
  const [timestamp, setTimestamp] = createSignal(init().timestamp ?? "");
  const [mediaRefsText, setMediaRefsText] = createSignal((init().mediaRefs || []).join("; "));
  const [year, setYear] = createSignal(init().year ?? "");
  const [place, setPlace] = createSignal(init().place ?? "");
  const [categories, setCategories] = createSignal((init().categories || []).slice());
  const [summary, setSummary] = createSignal(init().summary ?? "");
  const [touched, setTouched] = createSignal({});
  const [submitting, setSubmitting] = createSignal(false);

  let titleRef;
  onMount(() => {
    if (!editing() && titleRef) titleRef.focus();
  });

  const built = createMemo(() =>
    normalizeEvent({
      title: title(),
      type: type(),
      timestamp: timestamp(),
      mediaRefs: mediaRefsText(),
      year: year(),
      place: place(),
      categories: categories(),
      summary: summary(),
      source: init().source,
    }),
  );
  const validation = createMemo(() => validateEventFields(built()));
  const errors = createMemo(() => validation().errors);
  const show = (k) => (touched()[k] ? errors()[k] : undefined);
  const valid = createMemo(() => validation().ok);

  function toggleCat(c) {
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
    setTouched((t) => ({ ...t, categories: true }));
  }
  function blur(k) {
    setTouched((t) => ({ ...t, [k]: true }));
  }

  function submit(e) {
    if (e) e.preventDefault();
    setTouched({ title: true, type: true, timestamp: true, mediaRefs: true, year: true, place: true, categories: true, summary: true });
    if (!valid() || submitting()) return;
    setSubmitting(true);
    const record = built();
    if (editing()) updateEvent(init().id, record);
    else addEvent(record);
    setTimeout(() => props.onClose && props.onClose(), 60);
  }

  const inputCls = "w-full rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--focus)]";

  return (
    <Modal
      open={props.open}
      closing={props.closing}
      onClose={props.onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target && e.target.tagName === "INPUT" && e.target.type !== "submit") {
          e.preventDefault();
          submit();
        }
      }}
      label={editing() ? "Edit timeline event" : "Create timeline event"}
      initialFocus={() => titleRef}
      contentClass="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto thin-scroll border border-[color:var(--line)]"
    >
      <form onSubmit={submit} noValidate class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl font-semibold tracking-tight">{editing() ? "Edit event" : "Create event"}</h2>
          <button type="button" class="chrome-btn rounded-lg p-1.5 hover:bg-[color:var(--paper-deep)]" onClick={props.onClose} aria-label="Close form">
            <IconX size={20} />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <Field id="f-title" label="Title" error={show("title")}>
              <input id="f-title" ref={titleRef} class={inputCls} value={title()} onInput={(e) => setTitle(e.currentTarget.value)} onBlur={() => blur("title")} maxlength="120" />
            </Field>
          </div>

          <Field id="f-type" label="Type" error={show("type")}>
            <select id="f-type" class={inputCls} value={type()} onChange={(e) => { setType(e.currentTarget.value); blur("type"); }}>
              <For each={TYPES}>{(t) => <option value={t}>{t}</option>}</For>
            </select>
          </Field>

          <Field id="f-year" label="Year (integer, negative = BCE)" error={show("year")}>
            <input id="f-year" type="number" class={inputCls} value={year()} onInput={(e) => setYear(e.currentTarget.value)} onBlur={() => blur("year")} />
          </Field>

          <div class="sm:col-span-2">
            <Field id="f-timestamp" label="Timestamp (ISO-8601 ending with Z)" error={show("timestamp")}>
              <input id="f-timestamp" class={`${inputCls} mono`} placeholder="1455-01-01T00:00:00.000Z" value={timestamp()} onInput={(e) => setTimestamp(e.currentTarget.value)} onBlur={() => blur("timestamp")} />
              <p class="text-[11px] text-[color:var(--ink-soft)] mt-1">For year &ge; 1 the timestamp&rsquo;s UTC year must equal the year. For BCE the timestamp must be exactly 0001-01-01T00:00:00.000Z.</p>
            </Field>
          </div>

          <Field id="f-place" label="Place" error={show("place")}>
            <input id="f-place" class={inputCls} value={place()} onInput={(e) => setPlace(e.currentTarget.value)} onBlur={() => blur("place")} maxlength="80" />
          </Field>

          <div class="sm:col-span-2">
            <Field id="f-media" label="mediaRefs (separate with ; , 1-8 entries)" error={show("mediaRefs")}>
              <input id="f-media" class={`${inputCls} mono`} value={mediaRefsText()} onInput={(e) => setMediaRefsText(e.currentTarget.value)} onBlur={() => blur("mediaRefs")} />
            </Field>
          </div>

          <div class="sm:col-span-2">
            <Field id="f-cats" label="Categories (at least one)" error={show("categories")}>
              <div class="flex flex-wrap gap-1.5" role="group" aria-label="Categories">
                <For each={CATEGORIES}>
                  {(c) => {
                    const on = () => categories().includes(c.id);
                    return (
                      <button
                        type="button"
                        onClick={() => toggleCat(c.id)}
                        aria-pressed={on()}
                        class="chrome-btn inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                        style={{ "border-color": c.color, background: on() ? c.color : "white", color: on() ? "white" : "var(--ink)" }}
                      >
                        <span class="w-2 h-2 rounded-full" style={{ background: on() ? "white" : c.color }} />
                        {c.id}
                      </button>
                    );
                  }}
                </For>
              </div>
            </Field>
          </div>

          <div class="sm:col-span-2">
            <Field id="f-summary" label="Summary" error={show("summary")}>
              <textarea id="f-summary" rows="3" class={inputCls} value={summary()} onInput={(e) => setSummary(e.currentTarget.value)} onBlur={() => blur("summary")} maxlength="2000" />
            </Field>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-between gap-3">
          <p class="text-xs text-[color:var(--ink-soft)]">
            <Show when={valid()} fallback="Fix the highlighted fields to save.">
              Record conforms to the TimelineEvent contract &middot; {fmtYear(Number(year()) || 0)}
            </Show>
          </p>
          <div class="flex gap-2">
            <button type="button" class="chrome-btn rounded-lg border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit" disabled={!valid() || submitting()} class="chrome-btn inline-flex items-center gap-1.5 rounded-lg bg-[#1b6b4a] text-white px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110">
              <IconPlus size={16} /> {editing() ? "Save changes" : "Create event"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
