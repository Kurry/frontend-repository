import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Reorder, useDragControls } from "motion/react";
import {
  habitsAtom,
  activeFilterAtom,
  reorderByIdsAtom,
  uiPrefsAtom,
  type ViewMode,
} from "./store";
import HabitCard from "./components/HabitCard";
import HabitForm from "./components/HabitForm";
import CategoryFilter from "./components/CategoryFilter";
import HeatmapView from "./components/HeatmapView";
import StatsView from "./components/StatsView";
import ImportExport from "./components/ImportExport";
import RecoveryBanner from "./components/RecoveryBanner";
import { Toaster, toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Habit } from "./types";

function SortableHabit({
  habit,
  onOpenHeatmap,
  onDragSettled,
}: {
  habit: Habit;
  onOpenHeatmap: (id: string) => void;
  onDragSettled: () => void;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={habit.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 14px 32px rgba(27,36,48,0.18)",
        zIndex: 30,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className="relative outline-none"
      data-dragging="false"
      onDragStart={() => {
        const el = document.querySelector(`[data-habit-id="${habit.id}"]`)?.closest("[data-dragging]");
        el?.setAttribute("data-dragging", "true");
      }}
      onDragEnd={() => {
        const el = document.querySelector(`[data-habit-id="${habit.id}"]`)?.closest("[data-dragging]");
        el?.setAttribute("data-dragging", "false");
        onDragSettled();
      }}
    >
      <HabitCard habit={habit} dragControls={dragControls} onOpenHeatmap={onOpenHeatmap} />
    </Reorder.Item>
  );
}

function PausedHabit({
  habit,
  onOpenHeatmap,
}: {
  habit: Habit;
  onOpenHeatmap: (id: string) => void;
}) {
  const dragControls = useDragControls();
  return <HabitCard habit={habit} dragControls={dragControls} onOpenHeatmap={onOpenHeatmap} />;
}

export default function App() {
  const [habits] = useAtom(habitsAtom);
  const [activeFilter] = useAtom(activeFilterAtom);
  const [, reorderByIds] = useAtom(reorderByIdsAtom);
  const [uiPrefs, setUiPrefs] = useAtom(uiPrefsAtom);

  const [view, setView] = useState<ViewMode>(() => uiPrefs.lastView ?? "habits");
  const [heatmapHabitId, setHeatmapHabitId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const committedKey = useRef("");
  const orderIdsRef = useRef(orderIds);
  orderIdsRef.current = orderIds;

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.order - b.order),
    [habits]
  );
  const filteredHabits = activeFilter
    ? sortedHabits.filter((h) => h.categoryId === activeFilter)
    : sortedHabits;
  const activeHabits = filteredHabits.filter((h) => !h.paused);
  const pausedHabits = filteredHabits.filter((h) => h.paused);
  const activeKey = activeHabits.map((h) => h.id).join("|");

  useEffect(() => {
    const ids = activeHabits.map((h) => h.id);
    setOrderIds(ids);
    committedKey.current = ids.join("|");
  }, [activeKey]);

  const changeView = useCallback(
    (next: ViewMode) => {
      setView(next);
      if (next !== "heatmap") setHeatmapHabitId(null);
      if (next === "habits" || next === "stats" || next === "import") {
        setUiPrefs({ lastView: next });
      }
    },
    [setUiPrefs]
  );

  const openHeatmap = useCallback((id: string) => {
    setHeatmapHabitId(id);
    setView("heatmap");
  }, []);

  const goHome = useCallback(() => changeView("habits"), [changeView]);

  const settleReorder = useCallback(() => {
    const ids = orderIdsRef.current;
    const key = ids.join("|");
    if (!key || key === committedKey.current) return;
    committedKey.current = key;
    reorderByIds(ids);
    toast.info("Habits reordered");
  }, [reorderByIds]);

  const showCoach = !uiPrefs.coachDismissed && habits.length === 0 && view === "habits";

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1
                className="text-xl md:text-[28px] font-extrabold text-[#1B2430] cursor-pointer leading-tight"
                onClick={goHome}
              >
                <span className="text-[#0F9D74]">Loop</span>Daily
              </h1>
              <p className="text-[11px] font-medium text-[#64748B] mt-0.5" data-enhancement="local-first">
                Local-first workspace · offline ready
              </p>
            </div>

            <Tabs
              value={view === "heatmap" ? "habits" : view}
              onValueChange={(v) => changeView(v as ViewMode)}
            >
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger
                  value="habits"
                  data-nav="habits"
                  className="data-[state=active]:bg-[#0F9D74] data-[state=active]:text-white text-[#475569] bg-transparent hover:bg-[#F4F7F6]"
                >
                  Habits
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  data-nav="stats"
                  className="data-[state=active]:bg-[#0F9D74] data-[state=active]:text-white text-[#475569] bg-transparent hover:bg-[#F4F7F6]"
                >
                  Stats
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  data-nav="import"
                  className="data-[state=active]:bg-[#0F9D74] data-[state=active]:text-white text-[#475569] bg-transparent hover:bg-[#F4F7F6]"
                >
                  Data
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <RecoveryBanner />

      <main className="max-w-2xl mx-auto px-4 py-4 md:py-6 space-y-4">
        {showCoach && (
          <aside
            className="rounded-[8px] border border-[#0F9D74]/30 bg-[#FFFFFF] p-4 shadow-sm"
            data-coachmark
            aria-label="Getting started"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1B2430]">Quick tour</h2>
                <ol className="mt-2 space-y-1.5 text-sm text-[#64748B] list-decimal list-inside">
                  <li>
                    Tap <strong className="text-[#1B2430]">New Habit</strong> (or Create habit) to add your first loop.
                  </li>
                  <li>
                    Use <strong className="text-[#1B2430]">category chips</strong> to filter once you have categories.
                  </li>
                  <li>
                    Open <strong className="text-[#1B2430]">Data</strong> anytime for{" "}
                    <strong className="text-[#1B2430]">Export as JSON</strong>.
                  </li>
                </ol>
                <p className="mt-2 text-xs text-[#64748B]">
                  Tip: focus a habit card and press{" "}
                  <kbd className="rounded border border-[#E2E8F0] px-1">C</kbd> to check in.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs font-semibold shrink-0"
                onClick={() => setUiPrefs({ coachDismissed: true })}
                data-action="dismiss-coach"
              >
                Got it
              </button>
            </div>
          </aside>
        )}

        {view === "habits" && (
          <>
            <CategoryFilter />

            {habits.length === 0 ? (
              showForm ? (
                <HabitForm onClose={() => setShowForm(false)} />
              ) : (
                <div className="text-center py-12 bg-[#FFFFFF] rounded-[8px]">
                  <span className="text-5xl mb-4 block" aria-hidden="true">
                    🌱
                  </span>
                  <h3 className="text-lg font-bold text-[#1B2430] mb-2">No habits yet</h3>
                  <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto">
                    Start building good habits! Create your first habit to begin tracking your daily
                    progress.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="btn-primary px-6 py-3 font-semibold"
                    data-action="open-habit-form"
                  >
                    Create habit
                  </button>
                </div>
              )
            ) : (
              <>
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={orderIds}
                  onReorder={setOrderIds}
                  className="space-y-2"
                >
                  {orderIds.map((id) => {
                    const habit = activeHabits.find((h) => h.id === id);
                    if (!habit) return null;
                    return (
                      <SortableHabit
                        key={habit.id}
                        habit={habit}
                        onOpenHeatmap={openHeatmap}
                        onDragSettled={settleReorder}
                      />
                    );
                  })}
                </Reorder.Group>

                {pausedHabits.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#64748B] mb-2 px-1">
                      Paused Habits ({pausedHabits.length})
                    </h3>
                    <div className="space-y-2">
                      {pausedHabits.map((habit) => (
                        <PausedHabit
                          key={habit.id}
                          habit={habit}
                          onOpenHeatmap={openHeatmap}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {habits.length > 0 && (
              <div className="mt-2">
                {showForm ? (
                  <HabitForm onClose={() => setShowForm(false)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="w-full min-h-12 py-3 border-2 border-dashed border-[#E2E8F0] rounded-[8px] text-sm font-medium text-[#475569] hover:border-[#0F9D74] hover:text-[#0F9D74] transition-colors"
                    data-action="open-habit-form"
                  >
                    + New habit
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {view === "stats" && <StatsView onBack={goHome} />}

        {view === "heatmap" && heatmapHabitId && (
          <HeatmapView habitId={heatmapHabitId} onBack={goHome} />
        )}

        {view === "import" && <ImportExport />}
      </main>

      <Toaster position="bottom-center" />
    </div>
  );
}
