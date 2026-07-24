import { createSignal, createMemo, Show, For } from "solid-js";
import { store, saveEntry, updateEntry, deleteEntry, Virtue, JournalEntry } from "../store";
import { showToast } from "./Toast";

const PROMPTS = [
  "What brought me calm today?",
  "What challenged me and how did I respond?",
  "What am I grateful for right now?",
];

const VIRTUES: Virtue[] = ["Wisdom", "Courage", "Justice", "Temperance"];

const VIRTUE_COLORS: Record<Virtue, { bg: string; text: string; border: string }> = {
  Wisdom: { bg: "#1e3a5f", text: "#93c5fd", border: "#2563eb" },
  Courage: { bg: "#3b1f2b", text: "#f9a8d4", border: "#be185d" },
  Justice: { bg: "#1a3324", text: "#86efac", border: "#15803d" },
  Temperance: { bg: "#2e2a0e", text: "#fde68a", border: "#b45309" },
};

function VirtueBadge({ virtue }: { virtue: Virtue }) {
  const c = VIRTUE_COLORS[virtue];
  return (
    <span
      style={`background: ${c.bg}; color: ${c.text}; border: 1px solid ${c.border}; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-weight: 600;`}
    >
      {virtue}
    </span>
  );
}

export function JournalView() {
  const [prompt, setPrompt] = createSignal(PROMPTS[0]);
  const [response, setResponse] = createSignal("");
  const [virtue, setVirtue] = createSignal<Virtue>("Wisdom");
  const [error, setError] = createSignal("");
  const [shake, setShake] = createSignal(false);
  const [search, setSearch] = createSignal("");
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [editResponse, setEditResponse] = createSignal("");
  const [editVirtue, setEditVirtue] = createSignal<Virtue>("Wisdom");

  const filteredEntries = createMemo(() => {
    const q = search().toLowerCase().trim();
    if (!q) return store.entries;
    return store.entries.filter(e =>
      e.response.toLowerCase().includes(q) ||
      e.prompt.toLowerCase().includes(q) ||
      e.virtue.toLowerCase().includes(q)
    );
  });

  function handleSave() {
    const text = response().trim();
    if (!text) {
      setError("Please write a response before saving.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setError("");
    saveEntry({ prompt: prompt(), response: text, virtue: virtue() });
    setResponse("");
    showToast("Journal entry saved!");
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setEditResponse(entry.response);
    setEditVirtue(entry.virtue);
  }

  function saveEdit(id: string) {
    const text = editResponse().trim();
    if (!text) return;
    updateEntry(id, { response: text, virtue: editVirtue() });
    setEditingId(null);
    showToast("Entry updated.");
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    showToast("Entry deleted.");
  }

  function exportJournal() {
    const text = store.entries
      .map(e =>
        `Date: ${e.date}\nPrompt: ${e.prompt}\nVirtue: ${e.virtue}\nResponse:\n${e.response}\n`
      )
      .join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agora-journal.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h2 style="font-size: 32px; color: #e2e8f0; font-weight: 700; margin: 0;">Journal</h2>
        <button
          class="btn px-4 py-2"
          style="background: #0b1e27; color: var(--color-accent); border: 1px solid #1e3a4a; font-size: 15px;"
          onClick={exportJournal}
        >
          Export Journal
        </button>
      </div>

      {/* Entry form */}
      <div class="rounded-lg p-5 flex flex-col gap-4" style="background: #0b1e27; border: 1px solid #1e3a4a;">
        <div class="flex flex-col gap-1">
          <label style="font-size: 14px; color: #94a3b8;">Reflection Prompt</label>
          <select
            class="rounded px-3 py-2"
            style="background: #0f2535; border: 1px solid #2d4e62; color: #e2e8f0; font-size: 16px; font-family: Heebo, sans-serif;"
            value={prompt()}
            onChange={e => setPrompt(e.currentTarget.value)}
          >
            {PROMPTS.map(p => <option value={p}>{p}</option>)}
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label style="font-size: 14px; color: #94a3b8;">Virtue</label>
          <div class="flex gap-2 flex-wrap">
            {VIRTUES.map(v => {
              const c = VIRTUE_COLORS[v];
              return (
                <button
                  class="btn px-3 py-1"
                  style={`font-size: 14px; border: 2px solid ${virtue() === v ? c.border : "#2d4e62"}; background: ${virtue() === v ? c.bg : "#0f2535"}; color: ${virtue() === v ? c.text : "#64748b"};`}
                  onClick={() => setVirtue(v)}
                  aria-pressed={virtue() === v}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label style="font-size: 14px; color: #94a3b8;">Your Response</label>
          <textarea
            class={`rounded px-3 py-2 resize-y ${shake() ? "shake" : ""}`}
            style="background: #0f2535; border: 1px solid #2d4e62; color: #e2e8f0; font-size: 16px; font-family: Heebo, sans-serif; min-height: 100px;"
            value={response()}
            onInput={e => { setResponse(e.currentTarget.value); setError(""); }}
            placeholder="Write your reflection here…"
          />
          <Show when={error()}>
            <p style="color: #f87171; font-size: 14px; margin: 0;" role="alert">{error()}</p>
          </Show>
        </div>

        <button
          class="btn px-6 py-3 text-white self-start"
          style="background: var(--color-primary); font-size: 17px;"
          onClick={handleSave}
        >
          Save Entry
        </button>
      </div>

      {/* Search */}
      <div class="flex flex-col gap-2">
        <input
          type="search"
          placeholder="Search journal…"
          class="rounded px-4 py-2"
          style="background: #0b1e27; border: 1px solid #1e3a4a; color: #e2e8f0; font-size: 16px; font-family: Heebo, sans-serif; width: 100%;"
          value={search()}
          onInput={e => setSearch(e.currentTarget.value)}
        />
      </div>

      {/* Journal History */}
      <div class="flex flex-col gap-3">
        <h3 style="font-size: 20px; color: #94a3b8; font-weight: 600; margin: 0;">History</h3>

        {store.entries.length === 0 ? (
          <div
            class="rounded-lg p-8 text-center"
            style="background: #0b1e27; border: 1px solid #1e3a4a; color: #64748b; font-size: 18px;"
          >
            <p>No entries yet.</p>
            <p style="font-size: 15px; margin-top: 8px;">Write your first reflection above to get started.</p>
          </div>
        ) : filteredEntries().length === 0 ? (
          <div
            class="rounded-lg p-6 text-center"
            style="background: #0b1e27; border: 1px solid #1e3a4a; color: #64748b; font-size: 16px;"
            role="status"
          >
            No results matching &ldquo;{search()}&rdquo;.
          </div>
        ) : (
          <For each={filteredEntries()}>
            {(entry) => (
              <div
                class="rounded-lg p-4 flex flex-col gap-3"
                style="background: #0b1e27; border: 1px solid #1e3a4a;"
                tabIndex={0}
              >
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span style="font-size: 13px; color: #64748b;">{entry.date}</span>
                    <VirtueBadge virtue={entry.virtue} />
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="btn px-3 py-1"
                      style="font-size: 13px; background: #1e3a4a; color: #94a3b8;"
                      onClick={() => startEdit(entry)}
                    >
                      Edit
                    </button>
                    <button
                      class="btn px-3 py-1"
                      style="font-size: 13px; background: #7f1d1d; color: #fca5a5;"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p style="font-size: 14px; color: #64748b; margin: 0; font-style: italic;">{entry.prompt}</p>

                {editingId() === entry.id ? (
                  <div class="flex flex-col gap-3">
                    <div class="flex gap-2 flex-wrap">
                      {VIRTUES.map(v => {
                        const c = VIRTUE_COLORS[v];
                        return (
                          <button
                            class="btn px-2 py-1"
                            style={`font-size: 13px; border: 2px solid ${editVirtue() === v ? c.border : "#2d4e62"}; background: ${editVirtue() === v ? c.bg : "#0f2535"}; color: ${editVirtue() === v ? c.text : "#64748b"};`}
                            onClick={() => setEditVirtue(v)}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      class="rounded px-3 py-2 resize-y"
                      style="background: #0f2535; border: 1px solid #2d4e62; color: #e2e8f0; font-size: 15px; font-family: Heebo, sans-serif; min-height: 80px;"
                      value={editResponse()}
                      onInput={e => setEditResponse(e.currentTarget.value)}
                    />
                    <div class="flex gap-2">
                      <button
                        class="btn px-4 py-2 text-white"
                        style="background: var(--color-primary); font-size: 14px;"
                        onClick={() => saveEdit(entry.id)}
                      >
                        Save
                      </button>
                      <button
                        class="btn px-4 py-2"
                        style="background: #1e3a4a; color: #94a3b8; font-size: 14px;"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style="font-size: 16px; color: #cbd5e1; white-space: pre-wrap; margin: 0;">{entry.response}</p>
                )}
              </div>
            )}
          </For>
        )}
      </div>
    </div>
  );
}
