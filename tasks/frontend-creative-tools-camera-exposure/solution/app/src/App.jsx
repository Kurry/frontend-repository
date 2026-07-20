import { Show } from "solid-js";
import { store, setStore } from "./store";
import MeterLab from "./MeterLab";
import PresetsCompare from "./PresetsCompare";
import HelpPanel from "./HelpPanel";

function ModeSwitch() {
  const modes = ["Meter/Lab", "Presets/Compare"];
  return (
    <div class="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10" role="group" aria-label="View mode">
      {modes.map((m) => (
        <button type="button" onClick={() => setStore("mode", m)} aria-pressed={store.mode === m} class={`hover-wash rounded-full px-3 py-1 font-display text-[11px] uppercase tracking-wider transition-colors ${store.mode === m ? "bg-primary text-white" : "text-white/70"}`}>
          {m}
        </button>
      ))}
    </div>
  );
}

function Coachmark() {
  return (
    <Show when={store.coachOpen}>
      <div class="pop-in absolute left-1/2 top-16 -translate-x-1/2 z-40 w-[min(420px,90vw)] rounded-2xl bg-ink/95 backdrop-blur-xl border border-primary/40 shadow-2xl p-4" role="note" aria-label="Quick introduction">
        <div class="flex items-start gap-3">
          <span class="font-display text-2xl text-primary leading-none">EV</span>
          <div class="text-sm text-white/85 leading-relaxed">
            <p class="font-display uppercase tracking-wider text-white mb-1">Welcome to the lab</p>
            <p><strong class="text-white">EV</strong> (exposure value) is the net light of your current stops plus the scene. Positive EV leans over-exposed, negative leans under — watch the red dot travel the left meter.</p>
            <p class="mt-2">The <strong class="text-white">histogram</strong> (Develop panel) maps shadow→highlight mass left→right and reshapes as you edit. Open the toolbar panels to reach every control.</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <button type="button" onClick={() => setStore("coachOpen", false)} class="hover-wash rounded-lg px-3 py-1.5 bg-primary text-white text-xs font-display tracking-wide">Got it</button>
        </div>
      </div>
    </Show>
  );
}

export default function App() {
  return (
    <div class="relative h-screen w-screen bg-black text-white overflow-hidden">
      <main class="absolute inset-0">
        {store.mode === "Meter/Lab" ? <MeterLab /> : <PresetsCompare />}
      </main>

      <header class="absolute top-3 right-3 z-40 flex items-center gap-2">
        <ModeSwitch />
        <HelpPanel />
      </header>

      <button type="button" onClick={() => setStore("helpOpen", (v) => !v)} class="md:hidden absolute bottom-3 right-3 z-40 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg" aria-label={store.helpOpen ? "Close exposure help" : "Open exposure help"}>
        <span class="font-display text-lg">{store.helpOpen ? "✕" : "?"}</span>
      </button>

      <Coachmark />
    </div>
  );
}
