import { createSignal, Show, createMemo } from "solid-js";
import { store, getWeeklySummary, clearRecoveryNotice, resetAllData, retryLoad, loadMalformedSample } from "./store";
import { QuoteView } from "./components/QuoteView";
import { FavoritesView } from "./components/FavoritesView";
import { MeditateView } from "./components/MeditateView";
import { JournalView } from "./components/JournalView";
import { StatsView } from "./components/StatsView";
import { ToastContainer } from "./components/Toast";

type Tab = "home" | "meditate" | "journal" | "stats" | "favorites";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "meditate", label: "Meditate" },
  { id: "journal", label: "Journal" },
  { id: "stats", label: "Stats" },
  { id: "favorites", label: "Favorites" },
];

function StreakIcon() {
  return <span style="font-size: 22px;">🔥</span>;
}

export default function App() {
  const [activeTab, setActiveTab] = createSignal<Tab>("home");
  const weekly = createMemo(() => getWeeklySummary());

  return (
    <div style="min-height: 100vh; background: var(--color-background);">
      {/* Nav bar */}
      <header style="background: #061219; border-bottom: 1px solid #1e3a4a; padding: 0 16px;">
        <div style="max-width: 700px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; padding: 8px 0;">
          <span style="font-size: 24px; font-weight: 700; color: var(--color-primary); letter-spacing: 1px; font-family: Heebo, sans-serif;">
            AGORA
          </span>
          <nav style="display: flex; gap: 4px; flex-wrap: wrap;">
            {TABS.map(tab => (
              <button
                class="btn"
                style={`font-size: 15px; padding: 6px 14px; transition: all 0.15s; ${
                  activeTab() === tab.id
                    ? "background: var(--color-primary); color: white;"
                    : "background: transparent; color: #64748b; hover:background: #0b1e27;"
                }`}
                classList={{ "opacity-80": activeTab() !== tab.id }}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab() === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Recovery notice */}
      <Show when={store.recoveryNotice}>
        <div
          class="px-4 py-3"
          style="background: #431407; border-bottom: 1px solid #7c2d12;"
          role="alert"
          aria-live="assertive"
        >
          <div style="max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <p style="color: #fed7aa; font-size: 16px; margin: 0;">{store.recoveryNotice}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button
                class="btn px-3 py-1"
                style="background: #92400e; color: #fde68a; font-size: 13px;"
                onClick={retryLoad}
              >
                Retry
              </button>
              <button
                class="btn px-3 py-1"
                style="background: #7f1d1d; color: #fca5a5; font-size: 13px;"
                onClick={() => { resetAllData(); clearRecoveryNotice(); }}
              >
                Reset
              </button>
              <button
                class="btn px-3 py-1"
                style="background: #0b1e27; color: #94a3b8; font-size: 13px;"
                onClick={clearRecoveryNotice}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Main content */}
      <main style="max-width: 700px; margin: 0 auto; padding: 24px 16px;">

        {/* HOME TAB */}
        <Show when={activeTab() === "home"}>
          <div class="flex flex-col gap-6">
            <h1 style="font-size: 40px; font-weight: 700; color: #e2e8f0; margin: 0;">
              Good day.
            </h1>

            {/* Streak */}
            <div
              class="rounded-lg p-5 flex items-center gap-4"
              style="background: #0b1e27; border: 1px solid #1e3a4a;"
            >
              <div style="font-size: 40px;">🔥</div>
              <div>
                <p style="font-size: 13px; color: #64748b; margin: 0;">Day Streak</p>
                <p style="font-size: 42px; font-weight: 700; color: #fde68a; margin: 0; line-height: 1;">{store.streak}</p>
              </div>
            </div>

            {/* Weekly summary */}
            <div
              class="rounded-lg p-5"
              style="background: #0b1e27; border: 1px solid #1e3a4a;"
            >
              <h3 style="font-size: 18px; color: #94a3b8; font-weight: 600; margin: 0 0 12px 0;">This Week</h3>
              <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div>
                  <p style="font-size: 13px; color: #64748b; margin: 0;">Meditations</p>
                  <p style="font-size: 32px; font-weight: 700; color: var(--color-accent); margin: 0;">{weekly().meditationCount}</p>
                </div>
                <div>
                  <p style="font-size: 13px; color: #64748b; margin: 0;">Journal Entries</p>
                  <p style="font-size: 32px; font-weight: 700; color: var(--color-accent); margin: 0;">{weekly().journalCount}</p>
                </div>
              </div>
            </div>

            {/* Quote */}
            <QuoteView />

            {/* Dev tools */}
            <div
              class="rounded-lg p-4 flex flex-col gap-3"
              style="background: #070e11; border: 1px dashed #1e3a4a;"
            >
              <p style="font-size: 13px; color: #475569; margin: 0;">Developer Tools</p>
              <button
                class="btn px-3 py-2 self-start"
                style="background: #0b1e27; color: #64748b; border: 1px solid #1e3a4a; font-size: 13px;"
                onClick={loadMalformedSample}
              >
                Load Malformed Sample
              </button>
            </div>
          </div>
        </Show>

        {/* MEDITATE TAB */}
        <Show when={activeTab() === "meditate"}>
          <MeditateView />
        </Show>

        {/* JOURNAL TAB */}
        <Show when={activeTab() === "journal"}>
          <JournalView />
        </Show>

        {/* STATS TAB */}
        <Show when={activeTab() === "stats"}>
          <StatsView />
        </Show>

        {/* FAVORITES TAB */}
        <Show when={activeTab() === "favorites"}>
          <FavoritesView />
        </Show>
      </main>

      <ToastContainer />
    </div>
  );
}
