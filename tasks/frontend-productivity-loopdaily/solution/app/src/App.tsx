import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
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
import { isDayComplete, todayKey } from "./utils/helpers";

export default function App() {
  const [habits] = useAtom(habitsAtom);
  const [activeFilter] = useAtom(activeFilterAtom);
  const [, reorderByIds] = useAtom(reorderByIdsAtom);
  const [uiPrefs, setUiPrefs] = useAtom(uiPrefsAtom);

  const [view, setView] = useState<ViewMode>(() => uiPrefs.lastView ?? "habits");
  const [heatmapHabitId, setHeatmapHabitId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const committedKey = useRef("");
  const orderIdsRef = useRef(orderIds);
  orderIdsRef.current = orderIds;
  const listRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.order - b.order),
    [habits]
  );
  const filteredHabits = activeFilter
    ? sortedHabits.filter((h) => h.categoryId === activeFilter)
    : sortedHabits;
  const activeHabits = filteredHabits.filter((h) => !h.paused);
  const pausedHabits = filteredHabits.filter((h) => h.paused);
  const completedToday = sortedHabits.filter((habit) => !habit.paused && isDayComplete(habit, todayKey())).length;
  const activeTotal = sortedHabits.filter((habit) => !habit.paused).length;
  const nextHabit = sortedHabits.find((habit) => !habit.paused && !isDayComplete(habit, todayKey()));
  const activeKey = activeHabits.map((h) => h.id).join("|");

  useEffect(() => {
    const ids = activeHabits.map((h) => h.id);
    setOrderIds(ids);
    committedKey.current = ids.join("|");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const commitOrder = useCallback(() => {
    const ids = orderIdsRef.current;
    const key = ids.join("|");
    if (!key || key === committedKey.current) return;
    committedKey.current = key;
    reorderByIds(ids);
    toast.info("Habits reordered");
  }, [reorderByIds]);

  // --- Pointer-driven drag reorder ----------------------------------------
  // Deliberately implemented on raw pointer events so that every pointermove
  // (even a single large jump) recomputes the insertion slot: the dragged card
  // is placed at the index derived from the pointer's Y against the midpoints
  // of the other cards, and the surrounding cards settle via CSS transitions.
  const computeDropIndex = useCallback(
    (clientY: number, excludeId: string): number => {
      const list = listRef.current;
      if (!list) return 0;
      const others = Array.from(
        list.querySelectorAll<HTMLElement>("[data-habit-wrapper]")
      ).filter((el) => el.dataset.habitWrapper !== excludeId);
      let index = 0;
      for (const el of others) {
        const rect = el.getBoundingClientRect();
        if (clientY > rect.top + rect.height / 2) index += 1;
      }
      return index;
    },
    []
  );

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent, habitId: string) => {
      e.preventDefault();
      dragRef.current = { id: habitId, pointerId: e.pointerId };
      setDraggingId(habitId);

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const ids = orderIdsRef.current;
        const from = ids.indexOf(drag.id);
        if (from === -1) return;
        const to = computeDropIndex(ev.clientY, drag.id);
        if (to === from) return;
        const next = [...ids];
        next.splice(from, 1);
        next.splice(to, 0, drag.id);
        setOrderIds(next);
      };

      const finish = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        dragRef.current = null;
        setDraggingId(null);
        commitOrder();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
    },
    [commitOrder, computeDropIndex]
  );

  // Keyboard fallback on the same drag handle: ArrowUp/ArrowDown move the
  // habit one slot and commit immediately.
  const handleMoveByKey = useCallback(
    (habitId: string, direction: -1 | 1) => {
      const ids = orderIdsRef.current;
      const from = ids.indexOf(habitId);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= ids.length) return;
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, habitId);
      setOrderIds(next);
      orderIdsRef.current = next;
      commitOrder();
    },
    [commitOrder]
  );

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
                <h2 className="text-xl font-bold text-[#1B2430]">Quick tour</h2>
                <ol className="mt-2 space-y-1.5 text-sm text-[#64748B] list-decimal list-inside">
                  <li>
                    Tap <strong className="text-[#1B2430]">Create habit</strong> to add your first habit.
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

            {habits.length > 0 && (
              <section
                className="today-glance rounded-[8px] border border-[#D8E4DF] bg-[#EAF7F2] px-4 py-3"
                aria-labelledby="today-glance-title"
                data-enhancement="today-glance"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 id="today-glance-title" className="text-base font-bold text-[#1B2430]">
                      Today at a glance
                    </h2>
                    <p className="text-sm text-[#475569]" aria-live="polite">
                      {completedToday} of {activeTotal} active habits complete
                    </p>
                  </div>
                  <p className="rounded-[8px] bg-white px-3 py-2 text-sm font-semibold text-[#0F6F54]">
                    {nextHabit ? `Up next: ${nextHabit.name}` : "All active habits complete"}
                  </p>
                </div>
              </section>
            )}

            {habits.length === 0 ? (
              showForm ? (
                <HabitForm onClose={() => setShowForm(false)} />
              ) : (
                <div className="text-center py-12 bg-[#FFFFFF] rounded-[8px]">
                  <span className="text-5xl mb-4 block" aria-hidden="true">
                    🌱
                  </span>
                  <h3 className="text-xl font-bold text-[#1B2430] mb-2">No habits yet</h3>
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
                <div ref={listRef} className="space-y-2" data-habit-list>
                  {orderIds.map((id) => {
                    const habit = activeHabits.find((h) => h.id === id);
                    if (!habit) return null;
                    return (
                      <div
                        key={habit.id}
                        data-habit-wrapper={habit.id}
                        data-dragging={draggingId === habit.id}
                        className={`habit-drag-wrapper relative ${
                          draggingId === habit.id ? "habit-drag-lifted" : ""
                        }`}
                      >
                        <HabitCard
                          habit={habit}
                          onOpenHeatmap={openHeatmap}
                          onDragHandlePointerDown={handleDragPointerDown}
                          onMoveByKey={handleMoveByKey}
                        />
                      </div>
                    );
                  })}
                </div>

                {pausedHabits.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#64748B] mb-2 px-1">
                      Paused habits ({pausedHabits.length})
                    </h3>
                    <div className="space-y-2">
                      {pausedHabits.map((habit) => (
                        <HabitCard
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
                    className="w-full min-h-12 py-3 border-2 border-dashed border-[#E2E8F0] rounded-[8px] text-sm font-medium text-[#475569] hover:border-[#0F9D74] hover:text-[#0F9D74] hover:bg-[#F0FAF6] transition-all"
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

      <Toaster position="top-right" />
    </div>
  );
}
